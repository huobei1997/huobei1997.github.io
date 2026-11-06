---
title: "RNA-Seq analysis pipeline: from raw reads to functional enrichment"
summary: "A reproducible workflow — QC, STAR and featureCounts on Linux, then DESeq2, plots and GO/KEGG enrichment in R."
date: 2025-11-21
tags: ["RNA-Seq"]
minutes: 8
cover: /blog/rnaseq_pipeline/cover.jpg
coverAlt: "RNA-Seq analysis pipeline"
---

A standardised, reproducible route through an RNA-seq experiment, in two halves: raw reads processed on Linux, then statistics and plots in R.

## Part 1 · Upstream (Linux)

### 1. Environment and directories

Four tools do the work: **fastp** (QC and adapter trimming in one pass), **STAR** (spliced alignment), **subread** (for `featureCounts`) and **samtools**. Install them into a dedicated Conda environment so nothing collides with the rest of your system.

```bash
conda create -n rnaseq
conda activate rnaseq
conda install -c bioconda -c conda-forge fastp star subread samtools

fastp --version && STAR --version && featureCounts -v && samtools --version
```

A fixed folder layout is the cheapest reproducibility measure there is:

```bash
mkdir -p 00.RawData    # raw FASTQ
mkdir -p 01.CleanData  # trimmed FASTQ
mkdir -p 02.Genome     # reference FASTA + GTF
mkdir -p 03.Align      # BAM
mkdir -p 04.Counts     # expression matrix
```

### 2. Reference files

You need the genome sequence (FASTA) and the annotation that says where genes, exons and transcripts sit (GTF). Ensembl, GENCODE and UCSC all work; keep the two files from the same release.

```bash
cd 02.Genome
wget https://ftp.ebi.ac.uk/pub/databases/gencode/Gencode_human/release_49/GRCh38.primary_assembly.genome.fa.gz
wget https://ftp.ebi.ac.uk/pub/databases/gencode/Gencode_human/release_49/gencode.v49.annotation.gtf.gz
gunzip *.gz
```

### 3. Build the STAR index

Expensive, but once per genome version.

```bash
STAR --runMode genomeGenerate \
     --runThreadN 16 \
     --genomeDir ./star_index \
     --genomeFastaFiles GRCh38.primary_assembly.genome.fa \
     --sjdbGTFfile gencode.v49.annotation.gtf \
     --sjdbOverhang 149
```

![Terminal output from STAR genomeGenerate](/blog/rnaseq_pipeline/star-index.jpg)

> **Choosing sjdbOverhang**
>
> Set it to **read length − 1**: 149 for PE150, 99 for PE100. Passing the GTF here is what lets STAR align accurately across splice junctions.
>
> If you don't know the read length, count it straight off the first read:
>
> ```bash
> zcat ../00.RawData/Sample1_1.fq.gz | head -n 2 | tail -n 1 | awk '{print length}'
> ```
>
> The `fastp` HTML report gives the same number under *Read1 before filtering → mean length*.

### 4. QC and trimming

```bash
cd ../01.CleanData

fastp -i ../00.RawData/Sample1_1.fq.gz \
      -I ../00.RawData/Sample1_2.fq.gz \
      -o Sample1_1.clean.fq.gz \
      -O Sample1_2.clean.fq.gz \
      -h Sample1.fastp.html \
      -j Sample1.fastp.json \
      --detect_adapter_for_pe \
      -w 8
```

`--detect_adapter_for_pe` finds the adapters for you. Always open the HTML report: quality, duplication rate and adapter content are all in it, and they decide whether the rest of the pipeline is worth running.

### 5. Alignment

```bash
cd ../03.Align

STAR --runThreadN 16 \
     --genomeDir ../02.Genome/star_index \
     --readFilesIn ../01.CleanData/Sample1_1.clean.fq.gz ../01.CleanData/Sample1_2.clean.fq.gz \
     --readFilesCommand zcat \
     --outFileNamePrefix Sample1_ \
     --outSAMtype BAM SortedByCoordinate \
     --outBAMsortingThreadN 8 \
     --quantMode GeneCounts
```

`--readFilesCommand zcat` reads the gzipped FASTQ on the fly. Sorted BAM straight out of STAR saves both disk space and a separate `samtools sort`. `--quantMode GeneCounts` costs nothing and gives you a `ReadsPerGene.out.tab` to sanity-check the mapping before quantification proper.

### 6. Quantification

```bash
cd ../04.Counts

featureCounts -T 16 \
              -p \
              -t exon \
              -g gene_id \
              -a ../02.Genome/gencode.v49.annotation.gtf \
              -o all_counts.txt \
              ../03.Align/*.bam
```

`-p` is mandatory for paired-end data and wrong for single-end. Counting `exon` features summarised by `gene_id` gives one row per gene; the wildcard puts every sample into one matrix.

## Part 2 · Downstream (R)

### 1. Import and sanity check

```r
# BiocManager::install(c("DESeq2", "tidyverse", "pheatmap", "clusterProfiler", "org.Hs.eg.db"))
library(DESeq2)
library(tidyverse)

counts_data <- read.table("all_counts.txt", header = TRUE, row.names = 1, sep = "\t")
colnames(counts_data) <- gsub("\\.\\.\\.03\\.Align\\.|_Aligned\\.sortedByCoord\\.out\\.bam", "",
                              colnames(counts_data))
counts_data <- counts_data[, 6:ncol(counts_data)]   # drop Chr/Start/End/Strand/Length

col_data <- read.table("metadata.txt", header = TRUE, row.names = 1, sep = "\t")

stopifnot(all(rownames(col_data) == colnames(counts_data)))

col_data$Condition <- factor(col_data$Condition, levels = c("Mock", "Infected"))
```

The `stopifnot` line is worth keeping. A silent mismatch between metadata rows and count columns gives you a result table that looks perfectly reasonable and is completely wrong.

### 2. DESeq2

```r
dds <- DESeqDataSetFromMatrix(countData = counts_data,
                              colData   = col_data,
                              design    = ~ Condition)

keep <- rowSums(counts(dds)) >= 10
dds  <- dds[keep, ]

dds <- DESeq(dds)
```

### 3. PCA

```r
vsd <- vst(dds, blind = FALSE)
plotPCA(vsd, intgroup = "Condition")
```

The variance-stabilising transform removes the dependence of variance on mean, which is what makes the PCA readable. This is where outliers and batch effects show up.

### 4. Differentially expressed genes

```r
res    <- results(dds, contrast = c("Condition", "Infected", "Mock"))
resLFC <- lfcShrink(dds, contrast = c("Condition", "Infected", "Mock"), type = "normal")

res_df <- as.data.frame(resLFC)

sig_genes <- res_df %>% filter(padj < 0.05 & abs(log2FoldChange) > 1)
write.csv(sig_genes, "Diff_Genes_Infected_vs_Mock.csv")
```

Shrinkage pulls the fold changes of low-count, high-dispersion genes towards zero, so the ranking you plot reflects evidence rather than noise.

### 5. Volcano plot

```r
res_df$diff <- "NO"
res_df$diff[res_df$log2FoldChange >  1 & res_df$padj < 0.05] <- "UP"
res_df$diff[res_df$log2FoldChange < -1 & res_df$padj < 0.05] <- "DOWN"

ggplot(res_df, aes(x = log2FoldChange, y = -log10(padj), color = diff)) +
  geom_point(alpha = 0.5) +
  scale_color_manual(values = c(DOWN = "blue", NO = "grey", UP = "red")) +
  geom_vline(xintercept = c(-1, 1), lty = 2) +
  geom_hline(yintercept = -log10(0.05), lty = 2) +
  theme_minimal() +
  labs(x = "log2 fold change", y = "-log10 adjusted P")
```

Naming the colours (`DOWN`, `NO`, `UP`) instead of relying on the alphabetical order of the factor levels saves you from silently swapping red and blue the day a category is missing.

### 6. Heatmap

```r
library(pheatmap)

mat <- assay(vsd)[rownames(sig_genes), ]

pheatmap(mat,
         scale = "row",          # z-score per gene
         show_rownames = FALSE,
         annotation_col = col_data)
```

### 7. GO and KEGG enrichment

```r
library(clusterProfiler)
library(org.Hs.eg.db)
library(biomaRt)

gene_list <- gsub("\\..*", "", rownames(sig_genes))   # strip Ensembl version suffix

mart <- useMart("ensembl", dataset = "hsapiens_gene_ensembl")
ids  <- getBM(attributes = c("ensembl_gene_id", "entrezgene_id", "hgnc_symbol"),
              filters = "ensembl_gene_id", values = gene_list, mart = mart)

ego <- enrichGO(gene = ids$entrezgene_id, OrgDb = org.Hs.eg.db, ont = "BP",
                pAdjustMethod = "BH", pvalueCutoff = 0.05)
dotplot(ego, showCategory = 20, title = "GO biological process")
```

![Dot plot of enriched GO biological process terms](/blog/rnaseq_pipeline/go-dotplot.png)

```r
kk <- enrichKEGG(gene = ids$entrezgene_id, organism = "hsa", pvalueCutoff = 0.05)
dotplot(kk, showCategory = 20, title = "KEGG pathways")
```

![Dot plot of enriched KEGG pathways](/blog/rnaseq_pipeline/kegg-dotplot.png)
