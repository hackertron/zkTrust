// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReviewStorage
 * @notice Stores reviews submitted through the ReviewRegistry and enforces nullifier uniqueness.
 * @dev Assumes cryptographic proof validity was checked before registry interaction.
 *      Ownable for potential future administrative functions (e.g., migration).
 */
contract ReviewStorage is Ownable {
    // Total number of reviews stored
    uint256 public reviewCount;

    // Review struct
    struct Review {
        uint256 id; // Unique ID for the review
        bytes32 productId; // ID of the product reviewed
        address reviewer; // Address of the original reviewer
        string content; // Text content of the review
        uint8 rating; // Numerical rating (1-5)
        bytes32 nullifier; // Unique identifier from the ZK proof to prevent duplicates
        uint256 timestamp; // Timestamp of submission
        string serviceName; // Name of the service/platform where interaction occurred (e.g., "Gumroad")
    }

    // --- Mappings ---
    // Maps review ID to Review struct
    mapping(uint256 => Review) public reviews;
    // Maps product ID to an array of review IDs for that product
    mapping(bytes32 => uint256[]) public productReviews;
    // Maps reviewer address to an array of review IDs submitted by that reviewer
    mapping(address => uint256[]) public reviewerReviews;
    // Maps nullifier hash to boolean indicating if it has been used
    // Public visibility allows external checks (e.g., by ReviewRegistry or frontend)
    mapping(bytes32 => bool) public usedNullifiers;

    // --- Events ---
    event ReviewAdded(
        uint256 indexed reviewId,
        bytes32 indexed productId,
        address indexed reviewer,
        uint8 rating,
        string serviceName
    );
    event ReviewUpdated(uint256 indexed reviewId, string newContent);
    event ReviewDeleted(uint256 indexed reviewId); // Note: Content is cleared, not deleted

    /**
     * @dev Constructor sets the initial owner of the contract.
     */
    constructor() Ownable(msg.sender) {}

    /**
     * @dev Adds a new review. Intended to be called only by the ReviewRegistry contract.
     * @notice Checks for nullifier uniqueness before storing.
     * @param productId ID of the product being reviewed.
     * @param reviewerAddress Address of the user submitting the review.
     * @param content Review text content.
     * @param rating Numerical rating (1-5).
     * @param nullifier Unique identifier from ZK proof (MUST be unique).
     * @param serviceName Name of the service (e.g., "Gumroad", "Luma").
     * @return The ID of the newly added review.
     */
    function addReview(
        bytes32 productId,
        address reviewerAddress, // Passed explicitly by ReviewRegistry
        string calldata content,
        uint8 rating,
        bytes32 nullifier,
        string calldata serviceName /* onlyReviewRegistry */
    ) external returns (uint256) {
        // Access Control Idea: Add a check `require(msg.sender == reviewRegistryAddress, "Only registry allowed");`
        // if you deploy ReviewRegistry address immutably or add a setter function for it.
        // For now, relying on the system design where only ReviewRegistry calls this.

        require(
            reviewerAddress != address(0),
            "Reviewer address cannot be zero"
        );
        require(rating >= 1 && rating <= 5, "Rating must be between 1 and 5");

        // --- Primary Nullifier Check ---
        // Prevents the same proof/purchase from being used for multiple reviews via this contract.
        require(!usedNullifiers[nullifier], "Storage: Nullifier already used");
        usedNullifiers[nullifier] = true; // Mark as used immediately

        // Increment review count and assign ID
        reviewCount++;
        uint256 newReviewId = reviewCount;

        // Create and store the review
        reviews[newReviewId] = Review({
            id: newReviewId,
            productId: productId,
            reviewer: reviewerAddress, // Use the passed reviewer address
            content: content,
            rating: rating,
            nullifier: nullifier,
            timestamp: block.timestamp,
            serviceName: serviceName
        });

        // Update lookup mappings
        productReviews[productId].push(newReviewId);
        reviewerReviews[reviewerAddress].push(newReviewId); // Use the passed reviewer address

        // Emit event with correct reviewer address
        emit ReviewAdded(
            newReviewId,
            productId,
            reviewerAddress,
            rating,
            serviceName
        );

        return newReviewId;
    }

    /**
     * @dev Retrieves a review by its ID.
     * @param reviewId ID of the review to retrieve.
     * @return id Review ID.
     * @return productId Product ID.
     * @return reviewer Address of the reviewer.
     * @return content Review content.
     * @return rating Review rating.
     * @return timestamp Review timestamp.
     * @return serviceName Name of the service.
     */
    function getReview(
        uint256 reviewId
    )
        external
        view
        returns (
            uint256 id,
            bytes32 productId,
            address reviewer,
            string memory content,
            uint8 rating,
            uint256 timestamp,
            string memory serviceName
        )
    {
        require(reviewId > 0 && reviewId <= reviewCount, "Invalid review ID");
        Review storage review = reviews[reviewId];
        return (
            review.id,
            review.productId,
            review.reviewer,
            review.content,
            review.rating,
            review.timestamp,
            review.serviceName
        );
    }

    /**
     * @dev Gets all review IDs for a specific product.
     * @param productId ID of the product.
     * @return Array of review IDs.
     */
    function getProductReviews(
        bytes32 productId
    ) external view returns (uint256[] memory) {
        return productReviews[productId];
    }

    /**
     * @dev Gets all review IDs submitted by a specific reviewer.
     * @param reviewer Address of the reviewer.
     * @return Array of review IDs.
     */
    function getReviewerReviews(
        address reviewer
    ) external view returns (uint256[] memory) {
        return reviewerReviews[reviewer];
    }

    /**
     * @dev Allows the original reviewer to update the content of their review.
     * @param reviewId ID of the review to update.
     * @param newContent New review content.
     */
    function updateReviewContent(
        uint256 reviewId,
        string calldata newContent
    ) external {
        require(reviewId > 0 && reviewId <= reviewCount, "Invalid review ID");
        // Check against the stored reviewer address
        require(
            msg.sender == reviews[reviewId].reviewer,
            "Not the review owner"
        );

        reviews[reviewId].content = newContent;
        emit ReviewUpdated(reviewId, newContent);
    }

    /**
     * @dev Allows the original reviewer or the contract owner to "delete" a review
     *      by clearing its content. The review entry itself remains.
     * @param reviewId ID of the review to delete.
     */
    function deleteReview(uint256 reviewId) external {
        require(reviewId > 0 && reviewId <= reviewCount, "Invalid review ID");
        require(
            msg.sender == reviews[reviewId].reviewer || msg.sender == owner(),
            "Not authorized to delete"
        );

        // Clear content instead of actual deletion to preserve history/ID sequence
        reviews[reviewId].content = "";
        // Consider clearing rating or adding a 'deleted' flag if needed elsewhere
        // reviews[reviewId].rating = 0;

        emit ReviewDeleted(reviewId);
    }

    /**
     * @dev Public view function to check if a nullifier has been used.
     *      Can be called by ReviewRegistry or external entities.
     * @param _nullifier The nullifier to check.
     * @return isUsed True if the nullifier exists in the usedNullifiers mapping.
     */
    function isNullifierUsed(
        bytes32 _nullifier
    ) external view returns (bool isUsed) {
        return usedNullifiers[_nullifier];
    }
}
