---
title: "RNA-Seq Analysis Pipeline"
summary: A comprehensive RNA-Seq analysis cover upstream processing (QC, STAR, featureCounts) and downstream R analysis (DESeq2, Volcano plots, Heatmaps, GO/KEGG).
date: 2025-11-21

# Featured image
image:
  caption: 'RNA-Seq Analysis Pipeline'
  preview_only: true

authors:
  - admin

tags:
  - RNA-Seq
  
---


This guide outlines a standard pipeline for RNA-seq data analysis, covering everything from upstream raw data processing in Linux to downstream statistical analysis and visualization in R.

## Part 1: Upstream Analysis (Linux Environment)

### 1. Environment & Directory Structure

**Software Prerequisites:**
It is recommended to use `conda` or `mamba` for version management.
* `fastp`: Ultra-fast QC and trimming.
* `star`: Spliced Transcripts Alignment to a Reference.
* `subread`: Contains `featureCounts` for quantification.
* `samtools`: Standard tool for BAM manipulation.

**Directory Initialization:**
A clean structure is the foundation of reproducible research. Run the following in your project root:

```bash
# Create standard directory structure
mkdir -p 00.RawData    # Raw FASTQ files
mkdir -p 01.CleanData  # Filtered FASTQ files
mkdir -p 02.Genome     # Reference genome and index
mkdir -p 03.Align      # Alignment results (BAM)
mkdir -p 04.Counts     # Expression matrix
```

### 2. Reference Preparation

You need to download the human reference genome (FASTA) and annotation file (GTF). Ensembl or GENCODE are the standard sources.

* **FASTA (.fa):** The genome sequence.
* **GTF (.gtf):** The gene annotation file (coordinates of exons/genes).

```bash
cd 02.Genome
# Download hg38 (GRCh38) genome sequence
wget [https://ftp.ebi.ac.uk/pub/databases/gencode/Gencode_human/release_44/GRCh38.primary_assembly.genome.fa.gz](https://ftp.ebi.ac.uk/pub/databases/gencode/Gencode_human/release_44/GRCh38.primary_assembly.genome.fa.gz)
# Download corresponding annotation
wget [https://ftp.ebi.ac.uk/pub/databases/gencode/Gencode_human/release_44/gencode.v44.annotation.gtf.gz](https://ftp.ebi.ac.uk/pub/databases/gencode/Gencode_human/release_44/gencode.v44.annotation.gtf.gz)
# Decompress
gunzip *.gz
```

> **🧬 PhD Pro-Tip (Virology Specific)**
>
> Since your research involves **Influenza infection**, if you intend to quantify viral gene expression (e.g., Matrix gene, NP gene) alongside the host, you **must concatenate** the viral genome FASTA and GTF with the human files.
>
> **Command Example:**
> `cat human.fa flu.fa > combined.fa` (Do the same for GTF)
>
> *If you skip this, viral reads will be discarded as "Unmapped" during alignment.*

### 3. Build Index

STAR requires a genome index to perform alignment. This step only needs to be done once per genome.

```bash
# Ensure you are in the 02.Genome directory
STAR --runMode genomeGenerate \
     --runThreadN 16 \
     --genomeDir ./star_index \
     --genomeFastaFiles GRCh38.primary_assembly.genome.fa \
     --sjdbGTFfile gencode.v44.annotation.gtf \
     --sjdbOverhang 149
```

**Parameter Explanation:**
* `--runMode genomeGenerate`: Tells STAR to build an index.
* `--sjdbOverhang 149`: Critical parameter. Ideally set to `Read Length - 1`. For standard PE150 sequencing, use 149.

### 4. QC & Trimming

We use `fastp` for its speed and automatic reporting. It handles adapter trimming and quality filtering simultaneously.

Assuming Paired-End (PE) data: `Sample1_1.fq.gz` and `Sample1_2.fq.gz`.

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

**Parameter Explanation:**
* `-h`: Generates a visual HTML report (highly recommended for manual inspection).
* `--detect_adapter_for_pe`: Automatically detects and trims adapters.

### 5. Alignment

This is the most computationally intensive step. We map the clean reads to the indexed reference.

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

**Parameter Explanation:**
* `--outSAMtype BAM SortedByCoordinate`: Outputs a coordinate-sorted BAM file directly. This is essential for IGV visualization later.
* `--quantMode GeneCounts`: Outputs a simple read count file, useful for a quick sanity check before full quantification.

### 6. Quantification

Use `featureCounts` (from the Subread package) to count reads mapping to genomic features (exons).

```bash
cd ../04.Counts
# Quantify all BAM files in the Align directory
featureCounts -T 16 \
              -p \
              -t exon \
              -g gene_id \
              -a ../02.Genome/gencode.v44.annotation.gtf \
              -o all_counts.txt \
              ../03.Align/*.bam
```

**Parameter Explanation:**
* `-p`: **Crucial.** Indicates Paired-end data.
* `-t exon`: Only count reads falling into exon regions.
* `../03.Align/*.bam`: Using a wildcard automatically merges all samples into a single count matrix.

---

## Part 2: Downstream Analysis (R Environment)

Once you have `all_counts.txt` (expression matrix) and `metadata.txt` (sample info), switch to R.

### 1. Setup & Data Import

```R
# Install packages if missing
# BiocManager::install(c("DESeq2", "tidyverse", "pheatmap", "clusterProfiler", "org.Hs.eg.db"))

library(DESeq2)
library(tidyverse)

# 1. Load Data
counts_data <- read.table("counts.txt", header=TRUE, row.names=1, sep="\t")
col_data <- read.table("metadata.txt", header=TRUE, row.names=1, sep="\t")

# PhD Tip: Verify that column names in counts match row names in metadata
all(rownames(col_data) == colnames(counts_data)) # Must return TRUE

# 2. Set Factors
# Assuming 'Condition' column has "Mock" and "Infected"
col_data$Condition <- factor(col_data$Condition, levels = c("Mock", "Infected"))
```

### 2. DESeq2 Workflow

```R
# Construct DESeqDataSet Object
dds <- DESeqDataSetFromMatrix(countData = counts_data,
                              colData = col_data,
                              design = ~ Condition)

# Pre-filtering: Remove rows with very low counts to reduce noise
keep <- rowSums(counts(dds)) >= 10
dds <- dds[keep, ]

# Run standard DESeq pipeline
dds <- DESeq(dds)
```

### 3. QC: Principal Component Analysis (PCA)

Before looking at DEGs, check sample clustering. Biological replicates should cluster together.

```R
# Variance Stabilizing Transformation for visualization
vsd <- vst(dds, blind=FALSE)

# Plot PCA
plotPCA(vsd, intgroup="Condition")
```

### 4. Extract Differentially Expressed Genes (DEGs)

```R
# Extract results: Infected vs Mock
res <- results(dds, contrast=c("Condition", "Infected", "Mock"))

# LFC Shrinkage (Improves accuracy of log2FC for low-count genes)
resLFC <- lfcShrink(dds, contrast=c("Condition", "Infected", "Mock"), type="normal")

# Convert to Dataframe
res_df <- as.data.frame(res)

# Filter Significant Genes (Standard: padj < 0.05 & |log2FC| > 1)
sig_genes <- res_df %>%
  filter(padj < 0.05 & abs(log2FoldChange) > 1)

# Save results
write.csv(sig_genes, "Diff_Genes_Infected_vs_Mock.csv")
```

### 5. Visualization

#### A. Volcano Plot

```R
library(ggplot2)

# Annotate Up/Down regulation
res_df$diff <- "NO"
res_df$diff[res_df$log2FoldChange > 1 & res_df$padj < 0.05] <- "UP"
res_df$diff[res_df$log2FoldChange < -1 & res_df$padj < 0.05] <- "DOWN"

# Plot
ggplot(res_df, aes(x=log2FoldChange, y=-log10(padj), color=diff)) +
  geom_point(alpha=0.5) +
  theme_minimal() +
  scale_color_manual(values=c("blue", "grey", "red")) +
  geom_vline(xintercept=c(-1, 1), lty=2) +
  geom_hline(yintercept=-log10(0.05), lty=2)
```

#### B. Heatmap

```R
library(pheatmap)

# Extract expression matrix for significant genes
sig_gene_names <- rownames(sig_genes)
mat <- assay(vsd)[sig_gene_names, ]

# Plot Heatmap (Scaled by row/gene)
pheatmap(mat, scale="row", show_rownames=FALSE, annotation_col=col_data)
```

### 6. Functional Enrichment (GO & KEGG)

Use `clusterProfiler` to interpret the biological meaning (e.g., "Is the Interferon pathway activated?").

```R
library(clusterProfiler)
library(org.Hs.eg.db)

# Convert IDs (Ensembl to Entrez)
gene_list <- rownames(sig_genes)
entrez_ids <- bitr(gene_list, fromType="ENSEMBL", toType="ENTREZID", OrgDb="org.Hs.eg.db")

# GO Enrichment (Biological Process)
ego <- enrichGO(gene = entrez_ids$ENTREZID,
                OrgDb = org.Hs.eg.db,
                ont = "BP",
                pAdjustMethod = "BH",
                pvalueCutoff = 0.05)
dotplot(ego, showCategory=20)

# KEGG Pathway Enrichment
kk <- enrichKEGG(gene = entrez_ids$ENTREZID,
                 organism = 'hsa', # hsa = homo sapiens
                 pvalueCutoff = 0.05)
dotplot(kk)
```
