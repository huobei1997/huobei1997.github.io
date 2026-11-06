---
title: "Assembling highly variable RNA viruses with IRMA"
summary: "Running the IRMA pipeline end to end, then checking its consensus against my own pipeline with pairwise NCBI BLAST."
date: 2025-11-24
tags: ["NGS"]
minutes: 4
cover: /blog/irma_workflow/cover.jpg
coverAlt: "Pairwise BLAST alignment of two consensus sequences"
---

Researchers working with RNA viruses keep running into the same question: **which reference genome should I use?** On top of that, most assembly pipelines are cumbersome enough that anyone without a bioinformatics background gives up early.

After a stretch of hand-written scripts I settled on **IRMA** (Iterative Refinement Meta-Assembler). It is simple, fast and accurate, and it picks the reference for you.

## 1. What IRMA does

IRMA was built for robust assembly, variant calling and phasing of highly variable RNA viruses, and ships with modules for influenza, ebolavirus and coronaviruses. It parallelises across cores, so it runs on a laptop as well as on a cluster.

- Project homepage: [IRMA — CDC](https://wonder.cdc.gov/amd/flu/irma/)
- Bioconda recipe: [bioconda/irma](https://bioconda.github.io/recipes/irma/README.html)

## 2. Installation with Conda

The least painful way to handle IRMA's dependencies (Perl, SAMtools, SSW) is Conda — or Mamba, if solving is slow.

```bash
# dedicated environment, to avoid version conflicts
conda create -n irma_env -c bioconda irma
conda activate irma_env
```

> **Common error · PackagesNotFoundError**
>
> IRMA lives on Bioconda, which is usually missing from a default channel list. Add the channels in priority order, then retry:
>
> ```bash
> conda config --add channels defaults
> conda config --add channels conda-forge
> conda config --add channels bioconda
> conda config --set channel_priority strict
> ```
>
> If dependency solving crawls, `mamba create -n irma_env -c bioconda irma` does the same job in a fraction of the time.

## 3. Running the assembly

To assemble an influenza sample with the built-in `FLU` module:

```bash
# IRMA <MODULE-config> <R1> <R2> <sample_name> [options]
IRMA FLU Sample1_R1.fastq.gz Sample1_R2.fastq.gz Sample1
```

The consensus you want ends up in `./Sample1/amended_consensus/Sample1_*.fa`.

### Validating against my own pipeline

IRMA is convenient — but is it accurate? I compared its consensus with the one from my custom pipeline using [NCBI BLAST](https://blast.ncbi.nlm.nih.gov/Blast.cgi?PROGRAM=blastn), with *Align two or more sequences* checked: custom pipeline as query, IRMA output as subject.

![Pairwise BLAST alignment of the custom-pipeline consensus against the IRMA output](/blog/irma_workflow/alignments.jpg)

Per. Ident came out at 99.91%, so a handful of mismatched bases were left to explain. Open the **Alignments** tab and read the vertical bars: a break in the line is a mismatch or an indel.

Mismatches at the very ends of a segment are usually trimming or sequencing artefacts. A mismatch in the middle is more likely to be real, and worth translating to see whether it changes an amino acid. Around 228–229 bp, for instance:

```text
Query (custom pipeline): ...AACAAGGACAGGCCCT...
Subject (IRMA):          ...AACAAGGACARRCCCT...
```

Here IRMA reports `RR` where my own pipeline reports `GG`. Under the IUPAC codes `R` means a purine — A or G. IRMA found a mixed base and kept the ambiguity; my pipeline committed to G. At this position IRMA is the more honest of the two.

> **What to do with a mid-sequence mismatch**
>
> Map the coordinate onto the gene's reading frame and check whether the codon changes: `GCA → GCC` is synonymous, while `GCA → GTA` swaps alanine for valine.

## 4. Verdict

For a quick look at sequence variation, IRMA is enough — simple and fast. For an unknown RNA virus, BLAST the reads first to pick the right module, or work step by step with tools matched to your sequences.
