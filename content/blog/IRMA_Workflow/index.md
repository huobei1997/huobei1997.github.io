---
title: "🧬 Robust assembly, variant calling, and phasing of highly variable RNA viruses."
summary: Documenting the analysis workflow and using NCBI BLAST to compare the results with my custom-developed pipeline.
date: 2025-11-24

# Featured image
image:
  caption: 'IRMA Workflow'
  preview_only: true

authors:
  - admin

tags:
  - NGS
  
---

Researchers working with RNA viruses (like Influenza or SARS-CoV-2) face a major pain point in their daily work: **handling high variability and quasispecies**. Standard assemblers often fail to capture the diversity or produce chimeric contigs when faced with mixed infections or intra-host evolution.

After attempting various manual scripts, I finally locked onto the **IRMA (Iterative Refinement Meta-Assembler)** pipeline. It is designed specifically for robust assembly, variant calling, and phasing of highly variable viruses. This blog post records the complete workflow—from installation to NCBI BLAST verification—and compares it with my own custom pipeline.

{{< toc mobile_only=true is_open=true >}}

## 1. What is IRMA?

IRMA is essentially a **comprehensive assembly toolkit** designed for "messy" viral data.

* **Iterative Refinement**: It doesn't just map once. It maps, builds a consensus, and re-maps iteratively to capture divergent reads.
* **Robust**: Capable of handling low-quality data or samples with significant mutations (indels).
* **Phasing Capabilities**: It can separate distinct haplotypes (e.g., co-infection of two Influenza strains).

## 2. Download & Installation (via Conda)

The most convenient way to install IRMA and manage its complex dependencies (Perl, SAMtools, SSW) is via **Conda** (or Mamba).

* **Project Homepage**: [IRMA - CDC](https://wonder.cdc.gov/amd/flu/irma/)
* **Bioconda Page**: [bioconda/irma](https://bioconda.github.io/recipes/irma/README.html)

### 💻 Installation Steps

1.  It is strongly recommended to create a dedicated environment to avoid version conflicts. Open your terminal and run:
    ```bash
    conda create -n irma_env -c bioconda irma
    ```
2.  Activate the environment before use:
    ```bash
    conda activate irma_env
    ```

> [!WARNING]+ Common Error: PackagesNotFoundError
> When trying to install, you might see an error indicating the package cannot be found:
>
> **PackagesNotFoundError: The following packages are not available from current channels:**
>
> This happens because IRMA is hosted on specific bioinformatics channels (Bioconda) which might not be in your default configuration.

### ✅ Fix Method

We need to configure the Conda channel priority correctly. Please operate according to the following steps:

1.  **Add necessary channels** in the correct order (priority matters):
    ```bash
    conda config --add channels defaults
    conda config --add channels conda-forge
    conda config --add channels bioconda
    ```
2.  **Set strict channel priority** (optional but recommended for stability):
    ```bash
    conda config --set channel_priority strict
    ```
3.  **Retry the installation** command.

> [!NOTE]
> If the dependency solving is too slow with standard `conda`, I highly recommend using **Mamba**:
> `mamba create -n irma_env -c bioconda irma`

## 3. The Workflow: Assembly & Validation

This section outlines the complete process of running the assembly and immediately verifying the results using NCBI's web tools to ensure the "Iterative Refinement" hasn't introduced artifacts.

### Step 1: Run the Assembly
To assemble an Influenza sample (using the built-in `FLU` module):

```bash
# 1. Ensure environment is active
conda activate irma_env

# 2. Run assembly
# Syntax: IRMA <MODULE-config> <R1.fastq.gz/R1.fastq> <R2.fastq.gz/R2.fastq> [path/to]<sample_name> [options]
IRMA FLU Sample1_R1.fastq.gz Sample1_R2.fastq.gz Sample1
```

Once finished, the key output file will be located at:
`./Sample1/amended_consensus/Sample1_*.fa`

### Step 2: Validate with NCBI BLAST (Two Sequences)

IRMA is aggressive in assembly, so we must verify if the generated consensus has drifted too far from known references or contains artifacts at the ends. We use the **NCBI BLAST "Align two or more sequences"** feature for a visual pairwise check.

1.  **Go to NCBI BLAST**: Open the [Standard Nucleotide BLAST](https://blast.ncbi.nlm.nih.gov/Blast.cgi?PROGRAM=blastn) page.
2.  **Enable Pairwise Alignment**:
    * Find and check the box **"Align two or more sequences"**.
    * *This splits the input interface into "Query Sequence" and "Subject Sequence" sections.*
3.  **Upload Sequences**:
    * **Query Sequence (Top Box)**: Upload or paste your IRMA output (`MySampleName.fasta`).
    * **Subject Sequence (Bottom Box)**: Upload or paste the standard viral reference genome (e.g., A/California/07/2009).
4.  **Run BLAST**: Click the "BLAST" button.

### Step 3: Interpreting Mismatches & AA Changes

Once the results load, you usually see ~1-2 base differences. To determine if these lead to **Amino Acid (AA) changes** (Non-synonymous mutations) or are just artifacts, follow these steps:

1.  **Switch to Alignments**: Click the **"Alignments"** tab (located next to the *Graphic Summary*).
2.  **Scan for Breaks**: Scroll down to see the base-by-base alignment. Look for breaks in the vertical lines (`|`):
    * **Line Present (`|`)**: The bases are identical.
    * **No Line / Gap**: This indicates a mismatch or indel.
3.  **Check the Position**:
    * **Ends of Sequence**: If the mismatch is at the very start or end, it is likely a sequencing artifact or trimming issue.
    * **Middle of Sequence**: If the mismatch is in the middle, it is likely a real biological mutation.

> [!TIP]+ Analysis Goal
> 
> If the mismatch is in the **middle**, map this coordinate to the gene's reading frame to see if the codon changes (e.g., `GCA` -> `GCC` is synonymous, but `GCA` -> `GTA` changes Alanine to Valine).

## 4. Benchmark: IRMA vs. My Custom Pipeline

I previously wrote a custom pipeline (Fastp -> BWA -> Samtools -> iVar) to handle this data. Here is a comparison of the results:

| Feature | IRMA (The Specialist) | My Custom Pipeline (The Generalist) |
| :--- | :--- | :--- |
| **Speed** | Slower (Iterative mapping takes time) | **Faster** (Single pass mapping) |
| **Indel Detection** | **Excellent** (Dynamic reference editing) | Poor (Often misaligns large gaps) |
| **Phasing** | **Native Support** (Separates co-infections) | Difficult (Requires external tools) |
| **Usage** | One command | Complex shell script |

### Case Study: The "Drifting" Gene
In a recent dataset, my custom pipeline failed to assemble the **Hemagglutinin (HA)** gene because the sample had a 15bp deletion compared to the reference. BWA clipped the reads, leading to low coverage holes.

**IRMA, however, succeeded.**
Because of its iterative nature, it "learned" the deletion in the first few cycles and updated the internal reference, allowing the reads to map perfectly in the final cycle.

### Conclusion

If you need speed for simple re-sequencing, a standard pipeline is fine. But for **high-variability RNA viruses**, **cross-species transmission**, or **co-infection analysis**, IRMA combined with careful BLAST validation is the robust choice that saves you from manual debugging.

Happy Assembling! 🧪
