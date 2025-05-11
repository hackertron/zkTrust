// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ReviewStorage.sol"; // Import the updated ReviewStorage

/**
 * @title ReviewRegistry
 * @notice Manages product/reviewer/service registries and orchestrates review submissions.
 * @dev Assumes cryptographic proof was verified on-chain via SDK *before* calling submitReview.
 *      Relies on ReviewStorage contract to check nullifier uniqueness. Ownable for admin functions.
 */
contract ReviewRegistry is Ownable {
    // Address of the ReviewStorage contract
    ReviewStorage public storageContract;

    // Counter for total registered products
    uint256 public productCount;

    // Struct definitions
    struct Product {
        bytes32 id; // Unique ID (e.g., hash of identifier)
        string name; // Product name
        string manufacturer; // Product manufacturer
        uint256 totalRating; // Sum of all ratings
        uint256 reviewCount; // Number of reviews received
    }

    struct Reviewer {
        address addr; // Reviewer's wallet address
        uint256 reputation; // Simple reputation score
        uint256 reviewCount; // Number of reviews submitted
    }

    struct Service {
        string name; // Name of the service (e.g., "Gumroad", "Luma")
        string domain; // Associated domain for the service
        bool isSupported; // Flag if service is currently supported (owner-managed)
    }

    // Mappings
    mapping(bytes32 => Product) public products;
    mapping(address => Reviewer) public reviewers;
    mapping(string => Service) public services; // Maps service name to Service struct

    // Events
    event ProductRegistered(
        bytes32 indexed productId,
        string name,
        string manufacturer
    );
    event ServiceAdded(string name, string domain);
    event ServiceRemoved(string name);
    event StorageContractUpdated(address newStorageAddress); // Renamed event
    event ReviewSubmitted(
        uint256 indexed reviewId,
        bytes32 indexed productId,
        address indexed reviewer,
        uint8 rating
    );

    /**
     * @dev Constructor sets the initial owner and the essential storage contract address.
     * @param _storage Address of the deployed ReviewStorage contract.
     */
    constructor(address _storage) Ownable(msg.sender) {
        require(_storage != address(0), "Invalid storage address");
        storageContract = ReviewStorage(_storage);
    }

    /**
     * @dev Registers a new product. Can be called by anyone.
     *      If a product gets its first review via submitReview before being registered,
     *      it will be auto-registered with default details.
     * @param productId Unique identifier for the product.
     * @param name Product name.
     * @param manufacturer Product manufacturer.
     */
    function registerProduct(
        bytes32 productId,
        string calldata name,
        string calldata manufacturer
    ) external {
        require(
            products[productId].id == bytes32(0),
            "Product already registered"
        );

        productCount++;
        products[productId] = Product({
            id: productId,
            name: name,
            manufacturer: manufacturer,
            totalRating: 0,
            reviewCount: 0
        });

        emit ProductRegistered(productId, name, manufacturer);
    }

    /**
     * @dev Gets product information including average rating.
     * @param productId ID of the product.
     * @return name Product name.
     * @return manufacturer Product manufacturer.
     * @return averageRating Average rating (0 if no reviews).
     * @return reviewCount Number of reviews.
     */
    function getProduct(
        bytes32 productId
    )
        external
        view
        returns (
            string memory name,
            string memory manufacturer,
            uint256 averageRating,
            uint256 reviewCount
        )
    {
        Product storage product = products[productId];
        if (product.id == bytes32(0)) {
            // Return defaults if product not explicitly or implicitly registered
            return ("Unknown Product", "Unknown Manufacturer", 0, 0);
        }

        uint256 avgRating = 0;
        if (product.reviewCount > 0) {
            avgRating = product.totalRating / product.reviewCount;
        }
        return (
            product.name,
            product.manufacturer,
            avgRating,
            product.reviewCount
        );
    }

    /**
     * @dev Gets reviewer information.
     * @param reviewerAddress Address of the reviewer.
     * @return reputation Reviewer's reputation score.
     * @return reviewCount Number of reviews submitted by the reviewer.
     */
    function getReviewer(
        address reviewerAddress
    ) external view returns (uint256 reputation, uint256 reviewCount) {
        Reviewer storage reviewer = reviewers[reviewerAddress];
        // Returns (0, 0) if reviewer not found, which is the default struct state
        return (reviewer.reputation, reviewer.reviewCount);
    }

    /**
     * @dev Adds a new supported service - only owner.
     * @param name Service name (used as key).
     * @param domain Service domain.
     */
    function addService(
        string calldata name,
        string calldata domain
    ) external onlyOwner {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(domain).length > 0, "Domain cannot be empty");
        require(!services[name].isSupported, "Service already supported");

        services[name] = Service({
            name: name,
            domain: domain,
            isSupported: true
        });

        emit ServiceAdded(name, domain);
    }

    /**
     * @dev Removes a service from the supported list (marks as unsupported) - only owner.
     * @param name Name of the service to remove.
     */
    function removeService(string calldata name) external onlyOwner {
        require(services[name].isSupported, "Service not supported");
        services[name].isSupported = false;
        emit ServiceRemoved(name);
    }

    /**
     * @dev Checks if a service is currently marked as supported.
     * @param name Name of the service to check.
     * @return True if the service is supported, false otherwise.
     */
    function isServiceSupported(
        string calldata name
    ) external view returns (bool) {
        return services[name].isSupported;
    }

    /**
     * @dev Updates the storage contract address - only owner.
     * @param storageAddr New storage contract address.
     */
    function updateStorageContract(address storageAddr) external onlyOwner {
        // Renamed function
        require(storageAddr != address(0), "Invalid storage address");
        storageContract = ReviewStorage(storageAddr);
        emit StorageContractUpdated(storageAddr); // Renamed event
    }

    /**
     * @dev Submits review data after proof has been verified via SDK.
     * @notice Requires proof to be verified on-chain using the SDK *before* this call.
     * @param nullifier Unique identifier to prevent duplicate reviews (checked by storage contract).
     * @param productId ID of the product being reviewed.
     * @param content Review text content.
     * @param rating Numerical rating (1-5).
     * @param serviceName Name of the service (e.g., "Gumroad").
     * @return The ID of the new review stored in ReviewStorage.
     */
    function submitReview(
        bytes32 nullifier,
        bytes32 productId,
        string calldata content,
        uint8 rating,
        string calldata serviceName
    ) external returns (uint256) {
        // Step 1: Cryptographic verification is assumed to be completed via SDK before this call.

        // Step 2: Add the review to storage, passing the original user's address (msg.sender)
        // The storage contract will perform the nullifier check.
        uint256 reviewId = storageContract.addReview(
            productId,
            msg.sender, // Pass the original caller's address
            content,
            rating,
            nullifier,
            serviceName
        );

        // Step 3: Update product statistics. Auto-register if product is new.
        Product storage product = products[productId];
        if (product.id == bytes32(0)) {
            // Product doesn't exist, auto-register it
            productCount++;
            products[productId] = Product({
                id: productId,
                name: "Unknown Product", // Default name, can be updated later if needed
                manufacturer: "Unknown Manufacturer", // Default manufacturer
                totalRating: rating,
                reviewCount: 1
            });
            // Optional: Emit ProductRegistered here if needed for off-chain listeners
            // emit ProductRegistered(productId, "Unknown Product", "Unknown Manufacturer");
        } else {
            // Product exists, update stats
            product.totalRating += rating;
            product.reviewCount += 1;
        }

        // Step 4: Update reviewer statistics
        Reviewer storage reviewer = reviewers[msg.sender];
        if (reviewer.addr == address(0)) {
            // First review from this address
            reviewer.addr = msg.sender;
            reviewer.reviewCount = 1;
            reviewer.reputation = 1; // Start reputation
        } else {
            // Existing reviewer
            reviewer.reviewCount += 1;
            reviewer.reputation += 1; // Simple reputation increment, can be made more complex
        }

        // Step 5: Emit event for successful submission
        emit ReviewSubmitted(reviewId, productId, msg.sender, rating);

        return reviewId;
    }

    /**
     * @dev Public view function to check nullifier status by querying the storage contract.
     * @param nullifier The nullifier to check.
     * @return isUsed Whether the nullifier has been used in storage.
     */
    function isNullifierUsed(
        bytes32 nullifier
    ) external view returns (bool isUsed) {
        // Delegate the check to the storage contract's public mapping
        return storageContract.usedNullifiers(nullifier);
    }
}
