import { useState } from 'react';
import { useWeb3 } from '@/context/Web3Context';
import { Contract } from 'ethers';

interface ReviewResult {
  success: boolean;
  reviewId?: number;
  error?: string;
  txHash?: string;
}

export function useReviewRegistry() {
  const { contracts, active, provider } = useWeb3();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submitReview = async (
    nullifier: string,
    productId: string,
    content: string,
    rating: number,
    serviceName: string
  ): Promise<ReviewResult> => {
    setIsSubmitting(true);

    try {
      if (!active || !provider || !contracts.reviewRegistry) {
        throw new Error('Wallet not connected or contract/provider not available');
      }

      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      const signer = await provider.getSigner();
      const contractWithSigner = contracts.reviewRegistry.connect(signer) as Contract;

      console.log("Calling contract submitReview with:", { nullifier, productId, content, rating, serviceName });
      const tx = await contractWithSigner.submitReview(
        nullifier,
        productId,
        content,
        rating,
        serviceName
      );

      console.log("Submit review transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Submit review transaction mined:", receipt);

      if (receipt?.status === 1) {
        let parsedReviewId: number | undefined = undefined;
        try {
          const event = contractWithSigner.interface.getEvent("ReviewSubmitted");
          const eventTopic = event ? event.topicHash : null;
          if (!eventTopic) {
            throw new Error("Event 'ReviewSubmitted' not found in contract interface");
          }
          const log = receipt.logs?.find((l: any) => l.topics[0] === eventTopic);
          if (log) {
            const parsedLog = contractWithSigner.interface.parseLog(log);
            if (parsedLog?.args?.reviewId) {
              parsedReviewId = Number(parsedLog.args.reviewId);
            }
          }
        } catch (logError) {
          console.warn("Could not parse reviewId from logs:", logError);
        }

        return {
          success: true,
          reviewId: parsedReviewId,
          txHash: tx.hash
        };
      } else {
        console.error("Submit review transaction failed:", receipt);
        return {
          success: false,
          error: `Transaction failed or reverted (Status: ${receipt?.status})`,
          txHash: tx.hash
        };
      }
    } catch (error: any) {
      console.error('Error submitting review via hook:', error);
      const message = error?.revert?.args?.[0] || error.message || 'Unknown error during review submission';
      return {
        success: false,
        error: message
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  // Register a new product
  const registerProduct = async (
    productId: string,
    name: string,
    manufacturer: string
  ): Promise<boolean> => {
    try {
      if (!active || !contracts.reviewRegistry) {
        return false;
      }

      const tx = await contracts.reviewRegistry.registerProduct(
        productId,
        name,
        manufacturer
      );

      await tx.wait();
      return true;
    } catch (error) {
      console.error('Error registering product:', error);
      return false;
    }
  };

  // Get product information
  const getProduct = async (productId: string) => {
    try {
      if (!active || !contracts.reviewRegistry) {
        return null;
      }

      const product = await contracts.reviewRegistry.getProduct(productId);
      return {
        name: product.name,
        manufacturer: product.manufacturer,
        averageRating: product.averageRating.toNumber(),
        reviewCount: product.reviewCount.toNumber()
      };
    } catch (error) {
      console.error('Error getting product:', error);
      return null;
    }
  };

  return {
    submitReview,
    registerProduct,
    getProduct,
    isSubmitting
  };
}
