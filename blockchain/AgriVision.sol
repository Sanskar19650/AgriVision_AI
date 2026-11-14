// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.19;

/**
 * @title AgriVisionDocumentRegistry
 * @notice Stores immutable SHA-256 cryptographic fingerprints and metadata
 *         for agricultural soil reports, crop certificates, 7/12 land records,
 *         and harvest receipts without storing raw PII or documents on-chain.
 */
contract AgriVisionDocumentRegistry {
    struct DocumentAnchor {
        bytes32 sha256Hash;
        string documentType;
        string farmReferenceId;
        address submittedBy;
        uint256 timestamp;
        bool exists;
    }

    mapping(bytes32 => DocumentAnchor) private registry;
    bytes32[] private registeredHashes;

    event DocumentRegistered(
        bytes32 indexed sha256Hash,
        string documentType,
        string farmReferenceId,
        address indexed submittedBy,
        uint256 timestamp
    );

    function registerDocument(
        bytes32 _sha256Hash,
        string calldata _documentType,
        string calldata _farmReferenceId
    ) external {
        require(_sha256Hash != bytes32(0), "Invalid SHA-256 hash");
        require(!registry[_sha256Hash].exists, "Document hash already anchored");

        registry[_sha256Hash] = DocumentAnchor({
            sha256Hash: _sha256Hash,
            documentType: _documentType,
            farmReferenceId: _farmReferenceId,
            submittedBy: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });

        registeredHashes.push(_sha256Hash);

        emit DocumentRegistered(
            _sha256Hash,
            _documentType,
            _farmReferenceId,
            msg.sender,
            block.timestamp
        );
    }

    function verifyDocument(bytes32 _sha256Hash)
        external
        view
        returns (
            bool verified,
            string memory documentType,
            string memory farmReferenceId,
            address submittedBy,
            uint256 timestamp
        )
    {
        DocumentAnchor memory anchor = registry[_sha256Hash];
        return (
            anchor.exists,
            anchor.documentType,
            anchor.farmReferenceId,
            anchor.submittedBy,
            anchor.timestamp
        );
    }

    function totalAnchoredDocuments() external view returns (uint256) {
        return registeredHashes.length;
    }
}
