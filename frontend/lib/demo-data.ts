export interface DemoFileItem {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  file_ext: string;
  preview_type: string;
  processing_status: string;
  index_status: string;
  chunk_count: number;
  is_searchable: boolean;
  created_at: number;
  text_content: string;
}

export const DEMO_FILES: DemoFileItem[] = [
  {
    id: "demo-quantum-computing-notes",
    filename: "Quantum_Computing_Principles.pdf",
    original_name: "Quantum_Computing_Principles.pdf",
    mime_type: "application/pdf",
    file_size: 142850,
    file_ext: ".pdf",
    preview_type: "pdf",
    processing_status: "indexed",
    index_status: "indexed",
    chunk_count: 8,
    is_searchable: true,
    created_at: 1726000000,
    text_content: `--- Page 1 ---
# Principles of Quantum Computing: Foundations and Qubits
Author: Prof. Elena Rostova, Department of Physics & Computing
Academic Term: Autumn 2026

## 1. Classical vs. Quantum Information
Classical computing is founded on the classical bit, which exists deterministically in one of two orthogonal states: 0 or 1. Mathematically, these represent the basis states of a two-dimensional vector space:
|0⟩ = [1, 0]^T
|1⟩ = [0, 1]^T

A quantum bit, or qubit, differs fundamentally due to the principle of quantum superposition. A pure state |ψ⟩ of a single qubit can be expressed as a linear combination:
|ψ⟩ = α|0⟩ + β|1⟩
where α and β are complex probability amplitudes satisfying the normalization constraint:
|α|^2 + |β|^2 = 1

--- Page 2 ---
## 2. Measurement and Wavefunction Collapse
Upon measurement in the computational basis {|0⟩, |1⟩}, the superposition state collapses probabilistically:
- Outcome 0 is observed with probability P(0) = |α|^2
- Outcome 1 is observed with probability P(1) = |β|^2
Once observed, subsequent measurements yield the same outcome deterministically until another unitary transformation is applied.

## 3. The Bloch Sphere Representation
A pure qubit state can be geometrically visualized on the surface of a unit three-dimensional sphere known as the Bloch Sphere. The state vector is parameterized by two real angles, polar angle θ (0 ≤ θ ≤ π) and azimuthal angle φ (0 ≤ φ < 2π):
|ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩
Points on the north pole represent |0⟩, points on the south pole represent |1⟩, and the equator represents equal superpositions with varying relative phases.

--- Page 3 ---
## 4. Multi-Qubit Systems and Quantum Entanglement
When combining multiple quantum systems, the state space is the tensor product of individual Hilbert spaces. For a two-qubit system:
H_total = H_1 ⊗ H_2 (dimension 2^2 = 4)
Basis states: {|00⟩, |01⟩, |10⟩, |11⟩}

A state |Ψ⟩ is entangled if it cannot be decomposed as a product of single-qubit states (|ψ_1⟩ ⊗ |ψ_2⟩). The canonical maximally entangled states are the four Bell States (EPR pairs):
|Φ+⟩ = (|00⟩ + |11⟩) / √2
|Φ-⟩ = (|00⟩ - |11⟩) / √2
|Ψ+⟩ = (|01⟩ + |10⟩) / √2
|Ψ-⟩ = (|01⟩ - |10⟩) / √2
Measuring one qubit of a Bell pair instantly projects the state of the other qubit, regardless of spatial separation.

--- Page 4 ---
## 5. Quantum Algorithms & Speedups
1. Shor's Algorithm: Factors an integer N in polynomial time O((log N)^3) using Quantum Phase Estimation and the Quantum Fourier Transform (QFT). This poses an existential risk to RSA and elliptic-curve cryptography.
2. Grover's Algorithm: Searches an unsorted database of N elements in O(√N) oracle queries, achieving a provable quadratic speedup over classical O(N) search.
3. Quantum Decoherence: The physical challenge wherein coupling to the environment causes the loss of quantum coherence, destroying superpositions and requiring Quantum Error Correction (surface codes).`
  },
  {
    id: "demo-deep-learning-transformers",
    filename: "Transformer_Architectures_Deep_Dive.pdf",
    original_name: "Transformer_Architectures_Deep_Dive.pdf",
    mime_type: "application/pdf",
    file_size: 218400,
    file_ext: ".pdf",
    preview_type: "pdf",
    processing_status: "indexed",
    index_status: "indexed",
    chunk_count: 12,
    is_searchable: true,
    created_at: 1726050000,
    text_content: `--- Page 1 ---
# Deep Learning: Transformer Architecture & Scaled Dot-Product Attention
AI Research Monograph (2026 Edition)

## 1. Motivation: Beyond Recurrent Neural Networks
Recurrent Neural Networks (RNNs) and LSTMs process sequential data token by token, creating an architectural bottleneck:
- O(N) sequential computation steps prevent parallelization across long sequences.
- Vanishing and exploding gradients hinder retention of distant contextual dependencies.
The Transformer architecture (Vaswani et al.) eliminates recurrence entirely, relying solely on multi-head self-attention mechanisms to model relationships between any two tokens in O(1) sequential path length.

--- Page 2 ---
## 2. Scaled Dot-Product Attention
Given input representations packed into Query (Q), Key (K), and Value (V) matrices:
Attention(Q, K, V) = softmax( (Q K^T) / √d_k ) V

Where:
- d_k is the dimension of the key vectors.
- The scaling factor 1/√d_k prevents the dot products from growing excessively large for high dimensions, which would otherwise push the softmax function into regions with vanishingly small gradients.
- Softmax outputs a row-stochastic probability distribution assigning attention weights across all tokens.

--- Page 3 ---
## 3. Multi-Head Attention Mechanism
Rather than computing attention once with d_model-dimensional keys, queries, and values, Multi-Head Attention projects Q, K, and V linearly h times with distinct learned linear projections:
MultiHead(Q, K, V) = Concat(head_1, ..., head_h) W^O
where head_i = Attention(Q W_i^Q, K W_i^K, V W_i^V)

This allows the network to jointly attend to information from distinct representation subspaces at different token positions simultaneously (e.g., syntactic vs. semantic relationships).

--- Page 4 ---
## 4. Positional Encodings
Since attention is permutation-invariant and contains no intrinsic notion of token sequence order, positional encodings are injected into the input embeddings:
PE_(pos, 2i) = sin(pos / 10000^(2i / d_model))
PE_(pos, 2i+1) = cos(pos / 10000^(2i / d_model))
Modern architectures also leverage Rotary Position Embeddings (RoPE) or ALiBi for improved context window extrapolation.

--- Page 5 ---
## 5. Normalization and Residual Connections
Each sub-layer (Attention and Feed-Forward Network) employs a residual connection followed by layer normalization:
LayerNorm(x + SubLayer(x))
Modern decoders predominantly favor Pre-LayerNorm (Pre-LN) or RMSNorm for enhanced training stability at scale.`
  }
];
