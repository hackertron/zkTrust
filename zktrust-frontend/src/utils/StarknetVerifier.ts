import { Provider, Contract, constants } from 'starknet';
import { Proof } from '@zk-email/sdk';

// This will be the actual ABI once the contract is compiled
const VerifierABI = [
  {
    inputs: [
      {
        name: "proof",
        type: "Proof"
      },
      {
        name: "public_inputs",
        type: "felt252[]"
      },
      {
        name: "product_name",
        type: "felt252"
      }
    ],
    name: "verify_purchase_proof",
    outputs: [
      {
        name: "is_valid",
        type: "bool"
      }
    ],
    type: "function"
  },
  {
    inputs: [
      {
        name: "proof_hash",
        type: "felt252"
      }
    ],
    name: "is_proof_verified",
    outputs: [
      {
        name: "is_verified",
        type: "bool"
      }
    ],
    type: "function"
  }
];

export interface StarknetProof {
  a: { x: string; y: string };
  b: { x: string; y: string };
  c: { x: string; y: string };
}

export class StarknetVerifier {
  private provider: Provider;
  private contract: Contract;
  
  constructor(contractAddress: string, network: 'testnet' | 'mainnet' = 'testnet') {
    // Initialize provider with the correct nodeUrl format
    // Sepolia is now the testnet for Starknet instead of Goerli
    const nodeUrl = network === 'testnet' 
      ? 'https://free-rpc.nethermind.io/sepolia-juno/v0_7'  // Public Nethermind node for Sepolia
      : 'https://free-rpc.nethermind.io/mainnet-juno/v0_7'; // Public Nethermind node for Mainnet
    
    this.provider = new Provider({ 
      nodeUrl: nodeUrl 
    });
    
    this.contract = new Contract(
      VerifierABI,
      contractAddress,
      this.provider
    );
  }
  
  /**
   * Verify a ZK proof using Starknet
   * @param proofObject The proof object from ZK Email SDK
   * @param publicInputs The public inputs for verification 
   * @param productName The product name to verify
   * @returns A promise resolving to the verification result
   */
  async verifyProof(proofObject: Proof, publicInputs: string[], productName: string): Promise<{
    verified: boolean;
    transactionHash?: string;
  }> {
    try {
      // Format proof for Starknet
      const starknetProof = this.formatProofForStarknet(proofObject);
      
      // Format public inputs for Starknet (as hex strings)
      // In Starknet.js, field elements are typically represented as hex strings
      const feltPublicInputs = publicInputs.map(input => {
        // If the input is already a hex string, use it directly
        if (input.startsWith('0x')) {
          return input;
        }
        // Otherwise, convert to hex string
        try {
          return '0x' + BigInt(input).toString(16);
        } catch {
          // If not a number, convert string to hex
          return '0x' + Buffer.from(input).toString('hex');
        }
      });
      
      // Format product name as hex string
      const feltProductName = productName.startsWith('0x')
        ? productName
        : '0x' + Buffer.from(productName).toString('hex');
      
      // Call the verification contract
      const result = await this.contract.verify_purchase_proof(
        starknetProof,
        feltPublicInputs,
        feltProductName
      );
      
      return {
        verified: result.is_valid,
        transactionHash: result.transaction_hash
      };
    } catch (error) {
      console.error("Starknet verification error:", error);
      return { verified: false };
    }
  }
  
  /**
   * Format a proof object from ZK Email SDK to Starknet-compatible format
   * @param proofObject The proof object from ZK Email SDK
   * @returns A Starknet-compatible proof object
   */
  private formatProofForStarknet(proofObject: Proof): StarknetProof {
    // Access proof components directly from the object
    // The exact structure may need adjustment based on the actual ZK Email SDK proof structure
    const proofData = proofObject as any; // Use any to access properties flexibly
    
    // Create Starknet-compatible proof structure - convert values to hex strings
    return {
      a: { 
        x: this.ensureHexString(proofData.a?.x), 
        y: this.ensureHexString(proofData.a?.y)
      },
      b: { 
        x: Array.isArray(proofData.b?.x) 
          ? this.ensureHexString(proofData.b.x[0]) + this.ensureHexString(proofData.b.x[1]).substring(2) 
          : this.ensureHexString(proofData.b?.x), 
        y: Array.isArray(proofData.b?.y) 
          ? this.ensureHexString(proofData.b.y[0]) + this.ensureHexString(proofData.b.y[1]).substring(2)
          : this.ensureHexString(proofData.b?.y)
      },
      c: { 
        x: this.ensureHexString(proofData.c?.x), 
        y: this.ensureHexString(proofData.c?.y)
      }
    };
  }
  
  /**
   * Helper method to ensure a value is represented as a hex string
   */
  private ensureHexString(value: any): string {
    if (value === undefined || value === null) {
      return '0x0';
    }
    
    if (typeof value === 'string' && value.startsWith('0x')) {
      return value;
    }
    
    try {
      // Try to convert to BigInt and then to hex
      return '0x' + BigInt(value).toString(16);
    } catch {
      // If conversion fails, return a default value
      return '0x0';
    }
  }
  
  /**
   * Check if a proof has been verified on Starknet
   * @param proofHash The hash of the proof to check
   * @returns A promise resolving to the verification status
   */
  async isProofVerified(proofHash: string): Promise<boolean> {
    try {
      // Ensure proofHash is in hex format
      const feltProofHash = proofHash.startsWith('0x') 
        ? proofHash 
        : '0x' + BigInt(proofHash).toString(16);
        
      const result = await this.contract.is_proof_verified(feltProofHash);
      return result.is_verified;
    } catch (error) {
      console.error("Error checking proof verification:", error);
      return false;
    }
  }
}

export default StarknetVerifier;