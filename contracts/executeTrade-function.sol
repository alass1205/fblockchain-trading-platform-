    // Fonction pour exécuter un trade avec transferFrom
    function executeTrade(
        address assetToken,
        address paymentToken,
        address seller,
        address buyer,
        uint256 assetAmount,
        uint256 paymentAmount
    ) external onlyOwner {
        // Vérifier que les allowances sont suffisantes
        require(
            IERC20(assetToken).allowance(seller, address(this)) >= assetAmount,
            "Seller asset allowance insufficient"
        );
        require(
            IERC20(paymentToken).allowance(buyer, address(this)) >= paymentAmount,
            "Buyer payment allowance insufficient"
        );
        
        // TransferFrom asset du vendeur vers acheteur
        require(
            IERC20(assetToken).transferFrom(seller, buyer, assetAmount),
            "Asset transfer failed"
        );
        
        // TransferFrom payment de l'acheteur vers vendeur
        require(
            IERC20(paymentToken).transferFrom(buyer, seller, paymentAmount),
            "Payment transfer failed"
        );
        
        // Émettre un événement pour la traçabilité
        emit Transfer(assetToken, seller, buyer, assetAmount);
        emit Transfer(paymentToken, buyer, seller, paymentAmount);
    }
