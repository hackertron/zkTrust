#[starknet::interface]
trait IZKTrustVerifier {
    fn verify_purchase_proof(
        ref self: ContractState,
        proof: Proof,
        public_inputs: Array<felt252>,
        product_name: felt252,
    ) -> bool;
    
    fn is_proof_verified(
        self: @ContractState,
        proof_hash: felt252
    ) -> bool;
}

#[derive(Drop, Clone, Copy, Serde)]
struct G1Point {
    x: felt252,
    y: felt252,
}

#[derive(Drop, Clone, Copy, Serde)]
struct G2Point {
    x: felt252,
    y: felt252,
}

#[derive(Drop, Clone, Copy, Serde)]
struct Proof {
    a: G1Point,
    b: G2Point,
    c: G1Point,
}