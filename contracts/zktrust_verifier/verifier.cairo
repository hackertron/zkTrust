#[starknet::contract]
mod ZKTrustVerifier {
    use garaga::groth16::verifier::{self, VerificationKey, Proof};
    use starknet::event::EventEmitter;
    
    #[storage]
    struct Storage {
        verified_proofs: LegacyMap::<felt252, bool>,
    }
    
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        ProofVerified: ProofVerified,
    }
    
    #[derive(Drop, starknet::Event)]
    struct ProofVerified {
        proof_hash: felt252,
        product_name: felt252,
    }

    #[external]
    fn verify_purchase_proof(
        ref self: ContractState,
        proof: Proof,
        public_inputs: Array<felt252>,
        product_name: felt252,
    ) -> bool {
        let verification_key = get_verification_key();
        let is_valid = verifier::verify(verification_key, proof, public_inputs);
        
        if is_valid {
            let proof_hash = compute_proof_hash(proof, public_inputs);
            self.verified_proofs.write(proof_hash, true);
            
            self.emit(ProofVerified { 
                proof_hash, 
                product_name 
            });
        }
        
        is_valid
    }
    
    #[view]
    fn is_proof_verified(
        self: @ContractState,
        proof_hash: felt252
    ) -> bool {
        self.verified_proofs.read(proof_hash)
    }
    
    fn compute_proof_hash(
        proof: Proof, 
        public_inputs: Array<felt252>
    ) -> felt252 {
        // Compute a hash of the proof and public inputs
        // Implementation uses a simple hashing approach
        let mut hash: felt252 = 0;
        
        // Hash the proof elements
        let a_x = proof.a.x;
        let a_y = proof.a.y;
        hash = hash + a_x + a_y;
        
        let b_x = proof.b.x;
        let b_y = proof.b.y;
        hash = hash + b_x + b_y;
        
        let c_x = proof.c.x;
        let c_y = proof.c.y;
        hash = hash + c_x + c_y;
        
        // Hash the public inputs
        let mut i: usize = 0;
        let len = public_inputs.len();
        while i < len {
            hash = hash + public_inputs[i];
            i = i + 1;
        }
        
        hash
    }
    
    fn get_verification_key() -> VerificationKey {
        // Return the verification key for email purchase proofs
        // This would be populated with actual values in a production environment
        VerificationKey {
            alpha_g1: G1Point { x: 0, y: 0 },
            beta_g2: G2Point { x: 0, y: 0 },
            gamma_g2: G2Point { x: 0, y: 0 },
            delta_g2: G2Point { x: 0, y: 0 },
            ic: Array<G1Point>::new(),
        }
    }
}