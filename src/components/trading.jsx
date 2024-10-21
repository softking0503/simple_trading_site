import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../assets/css/trading.css';

const Trading = () => {
    const [activeTab, setActiveTab] = useState('futures'); // default tab
    const [partialClosingPercent, setPartialClosingPercent] = useState(100);
    const [futuresUSDTBalance, setFuturesUSDTBalance] = useState(0);
    const [closingPosition, setClosingPosition] = useState(null);
    const [spotUSDTBalance, setSpotUSDTBalance] = useState(0);
    const [currentPrices, setCurrentPrices] = useState([]);
    const [futuresPositions, setFuturesPositions] = useState([]);
    const [spotPositions, setSpotPositions] = useState([]);
    const [futuresPositionsCount, setFuturesPositionsCount] = useState(0);
    const [futuresUnrealizedPL, setFuturesUnrealizedPL] = useState(0);
    const [futuresPositionsAmount, setFuturesPositionsAmount] = useState(0);
    const [spotBalances, setSpotBalances] = useState([]);
    const [spotClosedPositionsCount, setSpotClosedPositionsCount] = useState(0);
    const [showPopup, setShowPopup] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showPartialModal, setShowPartialModal] = useState(false);
    const [qrCodeUrl, setQRCodeUrl] = useState("");
    const [showQRCode, setShowQRCode] = useState(false);
    const [address, setAddress] = useState("your-crypto-address-here"); // Default address, you can change it dynamically
    const [futuresAssetType, setFuturesAssetType] = useState("BTC");
    const [spotAssetType, setSpotAssetType] = useState("BTC");
    const [totalValue, setTotalValue] = useState(0);
    const [showDeposit, setShowDeposit] = useState(true);
    const [showWithdraw, setShowWithdraw] = useState(true);
    const [selectedAsset, setSelectedAsset] = useState("USDT");
    const [selectedNetwork, setSelectedNetwork] = useState("ERC-20");
    const [availableAmount, setAvailableAmount] = useState(0.000);
    const [withdrawAddress, setWithdrawAddress] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [isWithdrawDisabled, setIsWithdrawDisabled] = useState(true);
    const [addressInput, setAddressInput] = useState("");
    const [amountInput, setAmountInput] = useState("");
    const [withdrawDisabled, setWithdrawDisabled] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [errorMessage2, setErrorMessage2] = useState('');
    const intervalRef = useRef(null);
    const assetsDropdownRef = useRef(null);
    const networksDropdownRef = useRef(null);
    const assetTypes = ["BTC", "ETH", "BNB", "NEO", "LTC", "SOL", "XRP", "DOT"];
    const [isAssetsDropdownOpen, setIsAssetsDropdownOpen] = useState(false);
    const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);

    const assetsOptions = [
        { name: 'ETH', imgSrc: 'img/ETH.png' },
        { name: 'BRETT', imgSrc: 'img/brett.png' },
        { name: 'PEOPLE', imgSrc: 'img/people.png' },
        { name: 'USDT', imgSrc: 'img/USDT.png' },
        { name: 'USDC', imgSrc: 'img/USDC.png' },
        { name: 'BNB', imgSrc: 'img/BNB.png' },
    ];

    const networkOptions = [
        { name: 'ERC-20', imgSrc: 'img/ETH3.png' },
        { name: 'BSC', imgSrc: 'img/bsc.png' },
        { name: 'Base', imgSrc: 'img/base.png' },
        { name: 'Arbitrum One', imgSrc: 'img/arb.png' },
    ];
    const navigate = useNavigate();
    const location = useLocation();
    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

    const handleAssetSelect = (assetName) => {
        setSelectedAsset(assetName);  // Update selected asset
        setIsAssetsDropdownOpen(false);     // Close dropdown after selection
    };

    const handleNetworkSelect = (network) => {
        setSelectedNetwork(network);
        setIsNetworkDropdownOpen(false)
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (assetsDropdownRef.current && !assetsDropdownRef.current.contains(event.target)) {
                setIsAssetsDropdownOpen(false);
            } else if (networksDropdownRef.current && !networksDropdownRef.current.contains(event.target)) {
                setIsNetworkDropdownOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [assetsDropdownRef, networksDropdownRef]);

    const copyAddress = () => {
        const address = document.getElementById("address").innerText;
        navigator.clipboard
            .writeText(address)
            .then(() => {
                alert("Address copied to clipboard");
            })
            .catch((err) => {
                alert("Failed to copy address");
            });
    }

    const closeFuturesPosition = async (position, reason) => {
        try {
            const response = await fetch('http://localhost:5000+/position/closeFuturesPosition', {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer ' + localStorage.getItem('token'),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    positionId: position.id, // Assuming each position has a unique ID
                    reason,
                }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();

            // Update futuresUSDTBalance after closing the position
            setFuturesUSDTBalance((prevBalance) => prevBalance + data.profitLoss);

            fetchUserData(); // Refresh user data

            // Display an alert based on the reason for closing the position
            switch (reason) {
                case 0:
                    alert('Position closed manually by user.');
                    break;
                case 1:
                    alert('Position closed automatically by TP.');
                    break;
                case 2:
                    alert('Position closed automatically by SL.');
                    break;
                case 3:
                    alert('Position closed due to liquidation.');
                    break;
                default:
                    alert('Position closed.');
                    break;
            }
        } catch (error) {
            console.error('Error closing position:', error);
            alert('Error closing position. Please try again.');
        }
    };

    const partialClose = async () => {
        const percent = parseFloat(partialClosingPercent);

        if (percent === 0) {
            alert('Please select a valid percent');
            return;
        }

        if (percent === 100) {
            closeFuturesPosition(closingPosition, 0);
        } else {
            try {
                const response = await fetch('http://localhost:5000/api/partialClosePosition', {
                    method: 'POST',
                    headers: {
                        Authorization: 'Bearer ' + localStorage.getItem('token'),
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        positionId: closingPosition.id, // Assuming each position has a unique ID
                        percent,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();

                // Update futuresUSDTBalance after closing position
                setFuturesUSDTBalance((prevBalance) => prevBalance + data.profitLoss);

                fetchUserData(); // Refresh user data
                alert(`Position partially closed by ${percent}%.`);

            } catch (error) {
                console.error('Error closing position:', error);
                alert('Error closing position. Please try again.');
            }
        }

        // Assuming you are controlling modal visibility with state
        document.getElementById("partial-closing-modal").style.display = "none";
    };

    const fetchUserData = async () => {
        try {
            const balanceResponse = await fetch("http://localhost:5000/api/balance/getBalance", {
                method: "POST",
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("token"),
                    "Content-Type": "application/json",
                },
            });

            const balanceData = await balanceResponse.json();

            setFuturesUSDTBalance(balanceData.futuresUSDTBalance);
            setSpotUSDTBalance(balanceData.spotUSDTBalance);

            // Spot balances and prices
            let updatedSpotBalances = [balanceData.spotUSDTBalance];

            const priceResponse = await fetch("http://localhost:5000/api/market/getCurrentPrice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            const priceData = await priceResponse.json();

            setCurrentPrices(priceData.currentPrices);

            // Update Futures and Spot Data
            const positionsResponse = await fetch("http://localhost:5000/api/position/getPositions", {
                method: "POST",
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("token"),
                    "Content-Type": "application/json",
                },
            });

            const positionsData = await positionsResponse.json();

            // Process futures positions
            let futuresPositionCount = 0;
            let futuresUnrealizedPL = 0;
            let futuresPositionsAmount = 0;

            if (positionsData.futuresPositions) {
                futuresPositionCount = positionsData.futuresPositions.length;

                positionsData.futuresPositions.forEach((position) => {
                    const currentPrice = priceData.currentPrices.find(
                        (item) => item.assetType === position.assetType
                    ).price;

                    // Perform P/L calculations and position management logic here
                    futuresUnrealizedPL += calculateUnrealizedPL(
                        position.entryPrice,
                        currentPrice,
                        position.amount,
                        position.leverage,
                        position.positionType
                    );
                });

                setFuturesUnrealizedPL(futuresUnrealizedPL);
                setFuturesPositionsAmount(futuresPositionsAmount);
                setFuturesPositions(positionsData.futuresPositions);
                setFuturesPositionsCount(futuresPositionCount);
            }

            // Process spot positions
            let spotPositionCount = 0;
            let updatedSpotBalancesCopy = [...updatedSpotBalances];

            if (positionsData.spotPositions) {
                spotPositionCount = positionsData.spotPositions.length;

                positionsData.spotPositions.forEach((position) => {
                    const currentPrice = priceData.currentPrices.find(
                        (item) => item.assetType === position.assetType
                    ).price;

                    if (position.positionType === 'buy') {
                        updatedSpotBalancesCopy[priceData.assetTypes.indexOf(position.assetType) + 1] += position.amount;
                    }

                    if (position.positionType === 'sell') {
                        updatedSpotBalancesCopy[priceData.assetTypes.indexOf(position.assetType) + 1] -= position.amount;
                    }
                });

                setSpotBalances(updatedSpotBalancesCopy);
                setSpotPositions(positionsData.spotPositions);
                setSpotClosedPositionsCount(spotPositionCount);
            }

            // Spot statistics
            let spotValue = spotUSDTBalance;
            updatedSpotBalancesCopy.forEach((balance, index) => {
                if (index > 0) {
                    spotValue += parseFloat(balance) * priceData.currentPrices[index - 1].price;
                }
            });

            // Total statistics
            let totalValue = futuresUSDTBalance + spotUSDTBalance + futuresPositionsAmount + futuresUnrealizedPL;
            setTotalValue(totalValue);

            // Updating server with latest values
            await fetch("http://localhost:5000/api/updateValue", {
                method: "POST",
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("token"),
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    futuresPositionsAmount,
                    futuresUnrealizedPL,
                    spotValue,
                    totalValue,
                }),
            });
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

    const calculateUnrealizedPL = (entryPrice,
        currentPrice,
        amount,
        leverage,
        positionType) => {
        let profitLoss = 0;
        const priceDifference = (currentPrice - entryPrice) / entryPrice; // Percentage change

        if (positionType === "Long") {
            profitLoss = amount * priceDifference; // Long: profit when price goes up
        } else if (positionType === "Short") {
            profitLoss = amount * -priceDifference; // Short: profit when price goes down
        }

        return profitLoss * leverage;
    }

    const generateQRCode = () => {
        const addressElement = document.getElementById("address");

        if (addressElement) {
            const address = addressElement.innerText; // Ensure the element exists
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
                address
            )}&size=150x150`;

            const qrCodeImg = document.getElementById("qr-code");
            if (qrCodeImg) {
                qrCodeImg.src = qrCodeUrl;
                qrCodeImg.style.display = "block"; // Show the QR code image
            }
        } else {
            console.error("Address element not found");
        }
    };

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const showPopup = urlParams.get('showPopup');

        if (showPopup === 'true') {
            setShowModal(true);

            setTimeout(() => {
                setShowQRCode(true);
                if (typeof generateQRCode === 'function') {
                    setTimeout(generateQRCode, 100); // Ensure QR code is generated after the modal is visible
                }
            }, 10); // Small delay to trigger modal animation
        }
    }, [location]);

    // Handle closing the modal when clicking outside of the modal
    const handleOutsideClick = (event) => {
        if (event.target.id === 'popup-modal') {
            setShowModal(false);
            setShowQRCode(false);
            navigate(window.location.pathname, { replace: true });
        }
    };

    // Function to handle deposit button click (update the URL)
    const handleDepositClick = () => {
        navigate('?showPopup=true');
    };

    // Function to handle transfer button click
    const handleTransferClick = () => {
        setShowTransferModal(true); // Open the transfer modal
    };

    const closePartialClosingModal = () => {
        setShowPartialModal(false);
    };

    const closeTransferUSDTModal = () => {
        setShowTransferModal(false);
    };

    const handleWindowClick = (event) => {
        if (event.target.id === 'partial-closing-modal') {
            setShowPartialModal(false);
        }
        if (event.target.id === 'transfer-USDT-modal') {
            setShowTransferModal(false);
        }
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const balanceResponse = await fetch("http://localhost:5000/api/balance/getBalance", {
                    method: "POST",
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("token"),
                        "Content-Type": "application/json",
                    },
                });
                const balanceData = await balanceResponse.json();
                setFuturesUSDTBalance(balanceData.futuresUSDTBalance);
                setSpotUSDTBalance(balanceData.spotUSDTBalance);

                const priceResponse = await fetch("http://localhost:5000/api/market/getCurrentPrice", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                });
                const priceData = await priceResponse.json();
                setCurrentPrices(priceData.currentPrices);
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        };

        fetchUserData();
        intervalRef.current = setInterval(fetchUserData, 500);

        return () => clearInterval(intervalRef.current);
    }, []);

    const futuresTrading = async (positionType, orderType) => {
        let betAmount = 0;
        let leverage = 0;
        let limitPrice = 0;

        if (orderType === "market") {
            betAmount = parseFloat(document.getElementById("bet-amount").value);
            leverage = parseFloat(document.getElementById("bet-leverage").value);
        } else if (orderType === "limit") {
            betAmount = parseFloat(document.getElementById("limit-amount").value);
            leverage = parseFloat(document.getElementById("limit-leverage").value);
            limitPrice = parseFloat(document.getElementById("limit-price").value);
            if (isNaN(limitPrice)) {
                alert("Please enter a valid Limit Price");
                return;
            }
        }

        if (isNaN(betAmount) || betAmount <= 0) {
            alert("Please enter a valid bet amount.");
            return;
        }
        if (isNaN(leverage) || leverage < 1 || leverage > 300) {
            alert("Please enter a valid leverage.");
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/api/position/openFuturesPosition", {
                method: "POST",
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("token"),
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    futuresAssetType,
                    positionType: positionType === "long" ? "Long" : "Short",
                    orderType: orderType,
                    amount: betAmount,
                    leverage: leverage,
                    limitPrice: limitPrice,
                }),
            });

            if (!response.ok) throw new Error("Network response was not ok");

            const data = await response.json();
            alert(`Placed a ${positionType} bet of $${betAmount}`);
            fetchUserData(); // Update balances after placing bet
        } catch (error) {
            console.error("Error placing bet:", error);
            alert("Error placing bet. Please try again.");
        }
    };

    const handleAssetTypeChange = (event, type) => {
        if (type === "futures") {
            setFuturesAssetType(event.target.value);
        } else if (type === "spot") {
            setSpotAssetType(event.target.value);
        }
    };

    const handleTransferUSDT = () => {
        const transferUSDTType = document.getElementById('transfer-USDT-type').value;
        const transferUSDTAmount = parseFloat(document.getElementById('transfer-USDT-amount').value);
        if (transferUSDTType == 'fromFutures') {
            if (transferUSDTAmount > futuresUSDTBalance) {
                alert("Insufficient USDT in the Futures account");
                return;
            } else {
                futuresUSDTBalance -= transferUSDTAmount;
                spotUSDTBalance += transferUSDTAmount;
            }
        }
        if (transferUSDTType = 'fromSpot') {
            if (transferUSDTAmount > spotUSDTBalance) {
                alert("Insufficient USDT in the Spot account");
                return;
            } else {
                console.log(futuresUSDTBalance, spotUSDTBalance);
                futuresUSDTBalance += transferUSDTAmount;
                spotUSDTBalance -= transferUSDTAmount;
                console.log(futuresUSDTBalance, spotUSDTBalance);
            }
        }
        fetch("http://localhost:5000/api/balance/updateBalance", {
            method: "POST",
            headers: {
                Authorization: "Bearer " + localStorage.getItem("token"),
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                futuresUSDTBalance,
                spotUSDTBalance,
            }),
        })
            .then((response) => {
                alert("Operation completed successfully!");
                response.json();
            })
            .catch((error) => console.error());
    };

    useEffect(() => {
        const loadUserData = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/balance/getBalance", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + localStorage.getItem("token"),
                    },
                });
                const data = await response.json();
                setAvailableAmount(parseFloat(data.balance)); // Set the available futuresUSDTBalance
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        };

        loadUserData();
    }, []);

    const validateForm = () => {
        const isValidAmount = !withdrawAmount.startsWith('0') &&
            !isNaN(parseFloat(withdrawAmount)) &&
            parseFloat(withdrawAmount) >= 10 &&
            parseFloat(withdrawAmount) <= availableAmount;

        if (withdrawAddress.length === 42 && isValidAmount) {
            setIsWithdrawDisabled(false);
        } else {
            setIsWithdrawDisabled(true);
        }
    };

    useEffect(() => {
        validateForm();
    }, [withdrawAddress, withdrawAmount]);

    const handleWithdrawRequest = async () => {
        if (isWithdrawDisabled) return;

        try {
            const response = await fetch('http://localhost:5000/api/withdraw/withdrawRequest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + localStorage.getItem('token'),
                },
                body: JSON.stringify({
                    address: withdrawAddress,
                    amount: withdrawAmount,
                    username: document.getElementById('welcome-message').textContent,
                }),
            });

            if (response.ok) {
                alert('Withdrawal request sent successfully!');
            } else {
                alert('Failed to send the withdrawal request.');
            }
        } catch (error) {
            console.error('Error sending withdrawal request:', error);
            alert('An error occurred.');
        }
    };

    const handleDepositToggle = () => {
        setShowDeposit(true);
    };

    const handleWithdrawToggle = () => {
        setShowWithdraw(true);
        setShowDeposit(false)
    };

    // Handle input changes
    const handleAddressChange = (e) => {
        setAddressInput(e.target.value);
        if (e.target.value.length !== 42) {
            setErrorMessage2("Invalid address");
        } else {
            setErrorMessage2("");
        }
        validateForm();
    };

    const handleAmountChange = (e) => {
        setAmountInput(e.target.value);
        const amountValue = e.target.value.trim();
        const inputAmount = parseFloat(amountValue);

        if (amountValue.startsWith("0")) {
            setErrorMessage("Minimum withdrawal amount is 10");
        } else if (isNaN(inputAmount)) {
            return;
        } else if (inputAmount < 10) {
            setErrorMessage("Minimum withdrawal amount is 10");
        } else if (inputAmount > availableAmount) {
            setErrorMessage("Insufficient amount");
        } else {
            setErrorMessage("");
        }
        validateForm();
    };

    // Add event listener to the window to detect clicks outside of modal
    useEffect(() => {
        window.addEventListener('click', handleWindowClick);

        // Clean up the event listener on component unmount
        return () => {
            window.removeEventListener('click', handleWindowClick);
        };
    }, []);


    // Close modal when clicking outside of the modal content
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (event.target.id === "popup-modal") {
                setShowPopup(false);
            }
        };

        window.addEventListener("click", handleClickOutside);
        return () => window.removeEventListener("click", handleClickOutside);
    }, []);

    useEffect(() => {
        fetchUserData();
    }, []);

    useEffect(() => {
        const handleLogout = async () => {
            await fetch("/logout", { method: "POST" });
            localStorage.removeItem("token");
            window.location.href = "/login"; // Redirect to the login page
        };

        const preventDropdownClose = (event) => {
            event.stopPropagation();
        };

        const hideMenu = (menuId) => {
            document.getElementById(menuId).style.display = 'none';
        };

        const showMenu = (menuId) => {
            document.getElementById(menuId).style.display = 'block';
        };

        const handleMouseLeaveWithDelay = (iconId, menuId) => {
            setTimeout(() => {
                if (!document.getElementById(menuId).matches(":hover")) {
                    hideMenu(menuId);
                }
            }, 100); // Small timeout to allow hover transition
        };

        const headerLogoutBtn = document.getElementById("headerlogout-btn");
        const icon2 = document.getElementById("icon2");
        const mainMenu2 = document.getElementById("main-menu2");
        const userIcon2 = document.getElementById("user-icon2");
        const icon3 = document.getElementById("icon3");
        const mainMenu = document.getElementById("main-menu");
        const userIcon = document.getElementById("user-icon");

        if (headerLogoutBtn) {
            headerLogoutBtn.addEventListener("click", handleLogout);
        }

        if (icon2) {
            icon2.addEventListener("click", preventDropdownClose);
        }

        if (mainMenu2) {
            mainMenu2.addEventListener("mouseleave", () => hideMenu("main-menu2"));
        }

        if (userIcon2) {
            userIcon2.addEventListener("mouseenter", () => showMenu("main-menu2"));
            userIcon2.addEventListener("mouseleave", () =>
                handleMouseLeaveWithDelay("user-icon2", "main-menu2")
            );
        }

        if (mainMenu2) {
            mainMenu2.addEventListener("mouseenter", () => showMenu("main-menu2"));
            mainMenu2.addEventListener("mouseleave", () => hideMenu("main-menu2"));
        }

        if (icon3) {
            icon3.addEventListener("click", preventDropdownClose);
        }

        if (mainMenu) {
            mainMenu.addEventListener("mouseleave", () => hideMenu("main-menu"));
        }

        if (userIcon) {
            userIcon.addEventListener("mouseenter", () => showMenu("main-menu"));
            userIcon.addEventListener("mouseleave", () =>
                handleMouseLeaveWithDelay("user-icon", "main-menu")
            );
        }

        if (mainMenu) {
            mainMenu.addEventListener("mouseenter", () => showMenu("main-menu"));
            mainMenu.addEventListener("mouseleave", () => hideMenu("main-menu"));
        }

        // Cleanup event listeners on unmount
        return () => {
            if (headerLogoutBtn) {
                headerLogoutBtn.removeEventListener("click", handleLogout);
            }

            if (icon2) {
                icon2.removeEventListener("click", preventDropdownClose);
            }

            if (mainMenu2) {
                mainMenu2.removeEventListener("mouseleave", () => hideMenu("main-menu2"));
                mainMenu2.removeEventListener("mouseenter", () => showMenu("main-menu2"));
            }

            if (userIcon2) {
                userIcon2.removeEventListener("mouseenter", () => showMenu("main-menu2"));
                userIcon2.removeEventListener("mouseleave", () =>
                    handleMouseLeaveWithDelay("user-icon2", "main-menu2")
                );
            }

            if (icon3) {
                icon3.removeEventListener("click", preventDropdownClose);
            }

            if (mainMenu) {
                mainMenu.removeEventListener("mouseleave", () => hideMenu("main-menu"));
                mainMenu.removeEventListener("mouseenter", () => showMenu("main-menu"));
            }

            if (userIcon) {
                userIcon.removeEventListener("mouseenter", () => showMenu("main-menu"));
                userIcon.removeEventListener("mouseleave", () =>
                    handleMouseLeaveWithDelay("user-icon", "main-menu")
                );
            }
        };
    }, []);

    return (
        <div>
            <div className="container">
                <div className="main-content">
                    <div
                        style={{
                            padding: '0 20px',
                            justifyContent: 'space-between',
                            width: '100%',
                            display: 'flex',
                            height: '64px',
                            backgroundColor: '#383839',
                            position: 'absolute',
                            zIndex: 100,
                            alignSelf: 'center',
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
                        }}
                    >
                        {/* Left */}
                        <div className="nav-left" style={{ display: 'flex', flexDirection: 'row' }}>
                            <div className="tab">
                                <button
                                    className={`tablinks ${activeTab === 'futures' ? 'active' : ''}`}
                                    onClick={() => handleTabClick('futures')}
                                >
                                    Futures Trading
                                </button>
                                <button
                                    className={`tablinks ${activeTab === 'spot' ? 'active' : ''}`}
                                    onClick={() => handleTabClick('spot')}
                                >
                                    Spot Trading
                                </button>
                            </div>
                        </div>

                        {/* Right */}
                        <div className="nav-right" style={{ flexDirection: 'row', display: 'flex' }}>
                            <button style={{ height: '60px', width: '120px', marginRight: '10px' }} className="deposit-btn" id="transfer-USDT-btn" onClick={handleTransferClick}>
                                <i style={{ marginRight: '10px' }} className="fas fa-arrow-right-arrow-left"></i>Transfer
                            </button>
                            <button style={{ height: '60px' }} className="deposit-btn" id="deposit-btn" onClick={handleDepositClick}>
                                <i style={{ marginRight: '10px' }} className="fas fa-wallet"></i>Deposit
                            </button>

                            {
                                showModal && (
                                    <div id="popup-modal" className={`popup-modal ${showModal ? 'show' : ''}`} onClick={handleOutsideClick}>
                                        <div className={`popup-modal-content ${showModal ? 'show' : ''}`}>
                                            <div id="user-info">
                                                <div className="zaclose">
                                                    <img src="img/close.png" id="popup-close-btn" className="closee" alt="close" onClick={handleOutsideClick} />
                                                    <h2 style={{ fontSize: '20px' }}>Transfer Crypto</h2>
                                                </div>
                                                <div className="deposit-header"></div>
                                                <div className="toggle-buttons-custom">
                                                    <button
                                                        id="deposit-toggle-custom"
                                                        className={`toggle-button-custom ${showDeposit ? 'active' : ''}`}
                                                        onClick={handleDepositToggle}
                                                    >
                                                        Deposit
                                                    </button>
                                                    <button
                                                        id="withdraw-toggle-custom"
                                                        className={`toggle-button-custom ${!showDeposit ? 'active' : ''}`}
                                                        onClick={handleWithdrawToggle}
                                                    >
                                                        Withdraw
                                                    </button>
                                                </div>

                                                {
                                                    showDeposit ? (
                                                        <div id="deposit-content-custom" className="content-section-custom active">
                                                            <div id="network-selectors">
                                                                {/* Asset Dropdown */}
                                                                <div className="custom-dropdown" style={{ flex: 1, fontWeight: 550, fontSize: '15px' }} ref={assetsDropdownRef}>
                                                                    <label className="choose">Choose Asset</label>
                                                                    <div
                                                                        className="custom-dropdown-selected"
                                                                        style={{
                                                                            marginBottom: '5px',
                                                                            marginTop: '5px',
                                                                            width: '100%',
                                                                            display: 'flex',
                                                                            justifyContent: 'space-between',
                                                                            alignItems: 'center',
                                                                            backgroundColor: '#26235a',
                                                                            padding: '10px',
                                                                            borderRadius: '8px',
                                                                        }}
                                                                        onClick={() =>
                                                                            setIsAssetsDropdownOpen(!isAssetsDropdownOpen)
                                                                        }
                                                                    >
                                                                        <span className="custom-dropdown-selected-text">{selectedAsset}</span>
                                                                        <span className="custom-dropdown-arrow">
                                                                            <img width="14px" src="img/arrow-right.png" alt="arrow" />
                                                                        </span>
                                                                    </div>
                                                                    {isAssetsDropdownOpen && (
                                                                        <div className="custom-dropdown-options">
                                                                            <hr className="separator2" />
                                                                            {assetsOptions.map((option, index) => (
                                                                                <div
                                                                                    key={index}
                                                                                    className="custom-dropdown-option"
                                                                                    style={{ display: 'flex', alignItems: 'center', padding: '5px 10px' }}
                                                                                    onClick={() => handleAssetSelect(option.name)} // Handle option click
                                                                                >
                                                                                    <img
                                                                                        src={option.imgSrc}
                                                                                        alt={option.name}
                                                                                        style={{ width: '24px', marginRight: '10px' }}
                                                                                    />
                                                                                    <span>{option.name}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Network Dropdown */}
                                                                <div className="custom-dropdown" style={{ flex: 1, fontWeight: 550, fontSize: '15px' }} ref={networksDropdownRef}>
                                                                    <label className="choose">Choose Network</label>
                                                                    <div
                                                                        className="custom-dropdown-selected"
                                                                        style={{
                                                                            marginBottom: '5px',
                                                                            marginTop: '5px',
                                                                            width: '100%',
                                                                            display: 'flex',
                                                                            justifyContent: 'space-between',
                                                                            alignItems: 'center',
                                                                            backgroundColor: '#26235a',
                                                                            padding: '10px',
                                                                            borderRadius: '8px',
                                                                        }}
                                                                        id="network-selector2"
                                                                        onClick={() => setIsNetworkDropdownOpen(!isNetworkDropdownOpen)}
                                                                    >
                                                                        <span className="custom-dropdown-selected-text">{selectedNetwork}</span>
                                                                        <span className="custom-dropdown-arrow">
                                                                            <img width="14px" src="img/arrow-right.png" alt="arrow" />
                                                                        </span>
                                                                    </div>
                                                                    {isNetworkDropdownOpen && (
                                                                        <div className="custom-dropdown-options">
                                                                            <hr className="separator2" />
                                                                            {networkOptions.map((option, index) => (
                                                                                <div
                                                                                    key={index}
                                                                                    className="custom-dropdown-option"
                                                                                    style={{ display: 'flex', alignItems: 'center', padding: '5px 10px' }}
                                                                                    onClick={() => handleNetworkSelect(option.name)} // Handle option click
                                                                                >
                                                                                    <img
                                                                                        src={option.imgSrc}
                                                                                        alt={option.name}
                                                                                        style={{ width: '24px', marginRight: '10px' }}
                                                                                    />
                                                                                    <span>{option.name}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="qr-add" style={{ marginBottom: '15px' }}>
                                                                <div id="qr-code-container">
                                                                    <img id="qr-code" style={{ display: 'none' }} alt="QR Code" />
                                                                </div>
                                                                <div id="address-container">
                                                                    <div style={{ overflow: 'hidden' }}>
                                                                        <label className="choose">Deposit Address</label>
                                                                        <div id="address"></div>
                                                                    </div>
                                                                    <img
                                                                        src="img/copy.png"
                                                                        style={{ width: '21px', marginTop: '15px' }}
                                                                        id="copy-icon"
                                                                        onClick={copyAddress}
                                                                        alt="Copy Icon"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div id="warningContainer" className="warning-container-darkblue">
                                                                <p className="warning-text">
                                                                    <img src="img/warning2.png" className="warning-icon" alt="Warning" />
                                                                    Minimum Deposit: $1.5 ∼ 1.5 USDT
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : showWithdraw ? (
                                                        <div id="withdraw-content-custom" className="content-section-custom active" style={{ fontWeight: 'bold' }}>
                                                            <div id="network-selectors">
                                                                <div className='network-selectors'>
                                                                    <div className='dropdown-network-selectors'>
                                                                        {/* Asset Dropdown for Withdraw */}
                                                                        <div className="custom-dropdown" style={{ flex: 1 }} ref={assetsDropdownRef}>
                                                                            <label className="choose">Choose Asset</label>
                                                                            <div
                                                                                className="custom-dropdown-selected"
                                                                                style={{
                                                                                    margin: '5px 0',
                                                                                    width: '100%',
                                                                                    display: 'flex',
                                                                                    justifyContent: 'space-between',
                                                                                    alignItems: 'center',
                                                                                    backgroundColor: '#26235a',
                                                                                    padding: '10px',
                                                                                    borderRadius: '8px',
                                                                                }}
                                                                                id="network-selector1"
                                                                                onClick={() =>
                                                                                    setIsAssetsDropdownOpen(!isAssetsDropdownOpen)
                                                                                }
                                                                            >
                                                                                <span className="custom-dropdown-selected-text" style={{ fontSize: '15px' }}>
                                                                                    {selectedAsset}
                                                                                </span>
                                                                                <span className="custom-dropdown-arrow">
                                                                                    <img width="14px" src="img/arrow-right.png" alt="arrow" />
                                                                                </span>
                                                                            </div>
                                                                            {isAssetsDropdownOpen && (
                                                                                <div className="custom-dropdown-options">
                                                                                    <hr className="separator2" />
                                                                                    {assetsOptions.map((option, index) => (
                                                                                        <div
                                                                                            key={index}
                                                                                            className="custom-dropdown-option"
                                                                                            style={{ display: 'flex', alignItems: 'center', padding: '5px 10px' }}
                                                                                            onClick={() => handleAssetSelect(option.name)} // Handle option click
                                                                                        >
                                                                                            <img
                                                                                                src={option.imgSrc}
                                                                                                alt={option.name}
                                                                                                style={{ width: '24px', marginRight: '10px' }}
                                                                                            />
                                                                                            <span>{option.name}</span>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Network Dropdown */}
                                                                        <div className="custom-dropdown" style={{ flex: 1, fontWeight: 550, fontSize: '15px' }} ref={networksDropdownRef}>
                                                                            <label className="choose">Choose Network</label>
                                                                            <div
                                                                                className="custom-dropdown-selected"
                                                                                style={{
                                                                                    marginBottom: '5px',
                                                                                    marginTop: '5px',
                                                                                    width: '160px',
                                                                                    display: 'flex',
                                                                                    justifyContent: 'space-between',
                                                                                    alignItems: 'center',
                                                                                    backgroundColor: '#26235a',
                                                                                    padding: '10px',
                                                                                    borderRadius: '8px',
                                                                                }}
                                                                                id="network-selector2"
                                                                                onClick={() => setIsNetworkDropdownOpen(!isNetworkDropdownOpen)}
                                                                            >
                                                                                <span className="custom-dropdown-selected-text">{selectedNetwork}</span>
                                                                                <span className="custom-dropdown-arrow">
                                                                                    <img width="14px" src="img/arrow-right.png" alt="arrow" />
                                                                                </span>
                                                                            </div>
                                                                            {isNetworkDropdownOpen && (
                                                                                <div className="custom-dropdown-options">
                                                                                    <hr className="separator2" />
                                                                                    {networkOptions.map((option, index) => (
                                                                                        <div
                                                                                            key={index}
                                                                                            className="custom-dropdown-option"
                                                                                            style={{ display: 'flex', alignItems: 'center', padding: '5px 10px' }}
                                                                                            onClick={() => handleNetworkSelect(option.name)} // Handle option click
                                                                                        >
                                                                                            <img
                                                                                                src={option.imgSrc}
                                                                                                alt={option.name}
                                                                                                style={{ width: '24px', marginRight: '10px' }}
                                                                                            />
                                                                                            <span>{option.name}</span>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <div className="amount-sectionz">
                                                                        <div className="razss">
                                                                            <label style={{ margin: 0 }} className="choose">
                                                                                Withdraw Address
                                                                            </label>
                                                                            <div id="error-message2" className="error-message2">
                                                                                {errorMessage2}
                                                                            </div>
                                                                        </div>
                                                                        <div className="input-wrapperz">
                                                                            <input
                                                                                type="text"
                                                                                value={withdrawAddress}
                                                                                onChange={(e) => {
                                                                                    setWithdrawAddress(e.target.value);
                                                                                    if (e.target.value.length !== 42) {
                                                                                        setErrorMessage2('Invalid address');
                                                                                    } else {
                                                                                        setErrorMessage2('');
                                                                                    }
                                                                                }}
                                                                                style={{ height: '20px', fontSize: '13px', fontWeight: 'bold' }}
                                                                                placeholder="0xc4.."
                                                                                className="inputz"
                                                                                id="addressInput"
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <div className="amount-sectionz">
                                                                        <div className="razss">
                                                                            <label style={{ margin: 0 }} className="choose">
                                                                                Amount
                                                                            </label>
                                                                            <div id="error-message" className="error-message">
                                                                                {errorMessage}
                                                                            </div>
                                                                        </div>
                                                                        <div className="input-wrapperz">
                                                                            <input
                                                                                id="amountInput"
                                                                                style={{ height: '20px', fontSize: '14px', fontWeight: 'bold' }}
                                                                                placeholder="10"
                                                                                className="inputz"
                                                                                type="number"
                                                                                value={withdrawAmount}
                                                                                onChange={(e) => {
                                                                                    setWithdrawAmount(e.target.value);
                                                                                    const amountValue = e.target.value.trim();
                                                                                    if (amountValue.startsWith('0') || parseFloat(amountValue) < 10) {
                                                                                        setErrorMessage('Minimum withdrawal amount is 10');
                                                                                    } else if (parseFloat(amountValue) > availableAmount) {
                                                                                        setErrorMessage('Insufficient amount');
                                                                                    } else {
                                                                                        setErrorMessage('');
                                                                                    }
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <div className="availablez">
                                                                        Available{' '}
                                                                        <span style={{ fontWeight: 'bold' }} id="availableAmount">
                                                                            {availableAmount}
                                                                        </span>
                                                                    </div>

                                                                    <div className="memo-sectionz">
                                                                        <label className="choose">MEMO (Optional)</label>
                                                                        <input
                                                                            type="text"
                                                                            style={{ fontSize: '12px', color: '#dcd9ff' }}
                                                                            className="inputz"
                                                                            placeholder=""
                                                                        />
                                                                    </div>

                                                                    <div className="network-feez">
                                                                        <span style={{ color: '#dcd9ff', fontSize: '14px' }}>Network Fee</span>
                                                                        <span style={{ fontSize: '14px' }} className="fee-valuez">
                                                                            &lt; 0.01 USDT
                                                                        </span>
                                                                    </div>

                                                                    <button className="withdraw-button33" id="withdrawButton" disabled={isWithdrawDisabled} onClick={handleWithdrawRequest}>
                                                                        Withdraw
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : null
                                                }

                                            </div>
                                        </div>
                                    </div>
                                )
                            }
                            <a
                                id="user-icon2"
                                style={{
                                    cursor: 'pointer',
                                    borderRadius: '20px',
                                    padding: '0 10px',
                                    height: '45px',
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                <span>Wallets</span>
                            </a>

                            <div id="icon2">
                                {/* Main dropdown content */}
                                <div
                                    id="main-menu2"
                                    className="dropdown-content2"
                                    style={{
                                        marginRight: '20px',
                                        width: '250px',
                                        padding: '20px',
                                        borderRadius: '10px',
                                        zIndex: 10,
                                        boxShadow: '0 4px 8px rgba(0.3, 0.3, 0.3, 0.3)',
                                    }}
                                >
                                    {/* Center the profile picture and welcome message */}
                                    <div className="balance-info">
                                        <span className="balance-text">
                                            <img style={{ width: '20px' }} src="/img/USDT.png" alt="USDT" />
                                        </span>
                                    </div>
                                    <hr
                                        className="separator3"
                                        style={{
                                            width: '70%',
                                            margin: '18px auto',
                                            border: 0,
                                            height: '1.8px',
                                            background: 'linear-gradient(to right, #ff8c00, #ff0080)',
                                            boxShadow: '0 0 5px rgba(0, 0, 0, 0.3)',
                                        }}
                                    />

                                    {/* Main menu items */}
                                    <a
                                        href="#"
                                        id="activity-link"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            textDecoration: 'none',
                                            marginBottom: '8px',
                                        }}
                                    >
                                        <img
                                            src="/img/activity.png"
                                            style={{
                                                width: '22px',
                                                height: '22px',
                                                marginRight: '20px',
                                                marginLeft: '5px',
                                            }}
                                            alt="Activity"
                                        />
                                        <p style={{ margin: 0, fontSize: '16px' }}>Spot</p>
                                    </a>

                                    <a
                                        href="#"
                                        id="privacy-security-link"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            textDecoration: 'none',
                                            marginBottom: '8px',
                                        }}
                                    >
                                        <img
                                            src="/img/lock.png"
                                            style={{
                                                width: '20px',
                                                height: '20px',
                                                marginRight: '20px',
                                                marginLeft: '4px',
                                            }}
                                            alt="Privacy"
                                        />
                                        <p style={{ margin: 0, fontSize: '16px' }}>Futures</p>
                                    </a>

                                    <a
                                        href="#"
                                        id="support-link"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            textDecoration: 'none',
                                            marginBottom: '8px',
                                        }}
                                    >
                                        <img
                                            src="/img/contact.png"
                                            style={{
                                                width: '20px',
                                                height: '20px',
                                                marginRight: '20px',
                                                marginLeft: '4px',
                                            }}
                                            alt="Contact"
                                        />
                                        <p style={{ margin: 0, fontSize: '16px' }}>Copy Trade</p>
                                    </a>
                                </div>
                            </div>

                            <a
                                id="user-icon"
                                style={{
                                    cursor: 'pointer',
                                    borderRadius: '20px',
                                    padding: '0 10px',
                                    height: '45px',
                                    fontWeight: 'bold',
                                    backgroundImage: 'linear-gradient(rgb(29, 28, 73), rgb(50, 49, 121))',
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                <img
                                    className="pfp"
                                    src="/img/pfp.png"
                                    style={{ pointerEvents: 'none' }}
                                    alt="Profile"
                                />
                                <div
                                    className="icon"
                                    style={{
                                        width: '25px',
                                        height: '20px',
                                        margin: '4px 20px 0 10px',
                                        pointerEvents: 'none',
                                    }}
                                >
                                    <span
                                        id="welcome-message-duplicate"
                                        style={{ pointerEvents: 'none', color: '#dcdcdc' }}
                                    >
                                        Login
                                    </span>
                                </div>
                                <img
                                    src="/img/arrow-down.png"
                                    style={{
                                        width: '16px',
                                        height: '16px',
                                        marginLeft: '10px',
                                        pointerEvents: 'none',
                                    }}
                                    alt="Arrow Down"
                                />
                            </a>

                            <div id="icon3">
                                {/* Main dropdown content */}
                                <div
                                    id="main-menu"
                                    className="dropdown-content"
                                    style={{
                                        marginRight: '20px',
                                        width: '250px',
                                        padding: '20px',
                                        borderRadius: '10px',
                                        zIndex: 10,
                                        boxShadow: '0 4px 8px rgba(0.3, 0.3, 0.3, 0.3)',
                                    }}
                                >
                                    {/* Center the profile picture and welcome message */}
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            marginBottom: '5px',
                                        }}
                                    >
                                        <img
                                            src="/img/pfp.png"
                                            className="pfp-large"
                                            style={{ width: '100px', height: '100px', borderRadius: '50%' }}
                                            alt="Profile Large"
                                        />
                                    </div>
                                    <hr
                                        className="separator3"
                                        style={{
                                            width: '70%',
                                            margin: '18px auto',
                                            border: 0,
                                            height: '1.8px',
                                            background: 'linear-gradient(to right, #ff8c00, #ff0080)',
                                            boxShadow: '0 0 5px rgba(0, 0, 0, 0.3)',
                                        }}
                                    />

                                    {/* Main menu items */}
                                    <a
                                        href="#"
                                        id="activity-link"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            textDecoration: 'none',
                                            marginBottom: '8px',
                                        }}
                                    >
                                        <img
                                            src="/img/activity.png"
                                            style={{
                                                width: '22px',
                                                height: '22px',
                                                marginRight: '20px',
                                                marginLeft: '5px',
                                            }}
                                            alt="Activity"
                                        />
                                        <p style={{ margin: 0, fontSize: '16px' }}>Activity</p>
                                    </a>

                                    <a
                                        href="#"
                                        id="privacy-security-link"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            textDecoration: 'none',
                                            marginBottom: '8px',
                                        }}
                                    >
                                        <img
                                            src="/img/lock.png"
                                            style={{
                                                width: '20px',
                                                height: '20px',
                                                marginRight: '20px',
                                                marginLeft: '4px',
                                            }}
                                            alt="Privacy"
                                        />
                                        <p style={{ margin: 0, fontSize: '16px' }}>Privacy & security</p>
                                    </a>

                                    <a
                                        href="#"
                                        id="support-link"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            textDecoration: 'none',
                                            marginBottom: '8px',
                                        }}
                                    >
                                        <img
                                            src="/img/contact.png"
                                            style={{
                                                width: '20px',
                                                height: '20px',
                                                marginRight: '20px',
                                                marginLeft: '4px',
                                            }}
                                            alt="Contact"
                                        />
                                        <p style={{ margin: 0, fontSize: '16px' }}>Contact</p>
                                    </a>

                                    <a
                                        href="login.html"
                                        id="headerlogout-btn"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            textDecoration: 'none',
                                        }}
                                    >
                                        <img
                                            src="/img/logout.png"
                                            style={{ width: '25px', height: '25px', marginRight: '20px' }}
                                            alt="Logout"
                                        />
                                        <p style={{ margin: 0, fontSize: '16px' }}>Login / Logout</p>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="total-statistics" style={{ marginTop: '80px' }}>
                        <span className="money-type">Est. Total Balance (USDT):</span>
                        <span className="money-value">{(futuresUSDTBalance + spotUSDTBalance).toFixed(2)}</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        <span className="money-type">Est. Total Value (USDT):</span>
                        <span className="money-value">{totalValue.toFixed(2)}</span>
                    </div>
                    <div id="now-price" style={{ margin: '10px' }}>
                        {currentPrices.map((price, index) => (
                            <span key={index}>
                                <span className="money-type">{price.assetType}:</span>
                                <span className="money-value">
                                    {new Intl.NumberFormat('en-US').format(price.price)}
                                </span>
                                &nbsp;&nbsp;&nbsp;&nbsp;
                                {index % 8 === 7 && <br />}
                            </span>
                        ))}
                    </div>
                    {
                        activeTab === 'futures' && (
                            <div id="futures" className="tabcontent trading-panel">
                                <div id="futures-statistics"></div>
                                <div className="order-panel">
                                    <div>
                                        Asset Type:
                                        <select id="futures-asset-type" onChange={handleAssetTypeChange}>
                                            {
                                                assetTypes.map((item, index) => (
                                                    <option value={item} key={index}>{item}</option> // Make sure to return the JSX here
                                                ))
                                            }
                                        </select>&nbsp;&nbsp;&nbsp;
                                        <span className="money-type">Current Price:</span>
                                        <span id="futures-current-price" className="money-value">Loading...</span>
                                        <span className="money-unit">USDT</span>
                                    </div>
                                    <div>
                                        <label style={{ color: 'rgb(255, 0, 0)', fontSize: '24px' }}>Market Order: </label>&nbsp;&nbsp;
                                        <label>Bet Amount:</label>
                                        <input type="number" id="bet-amount" min="1" max="100" style={{ width: '80px', fontSize: '20px' }} />
                                        <span className="money-unit">(USDT)</span>&nbsp;&nbsp;
                                        <label>Leverage:</label>
                                        <input type="number" id="bet-leverage" min="1" max="300" value="1" style={{ width: '50px', fontSize: '20px' }} />
                                        &nbsp;&nbsp;
                                        <button id="long-button" className="playbutttton" style={{ marginTop: '15px' }} onClick={() => futuresTrading("long", "market")}>Long</button>&nbsp;&nbsp;
                                        <button id="short-button" className="playbutttton" style={{ marginTop: '15px' }} onClick={() => futuresTrading("short", "market")}>Short</button>&nbsp;&nbsp;
                                    </div>
                                    <div>
                                        <label style={{ color: 'rgb(255, 0, 0)', fontSize: '24px' }}>Limit Order: </label>&nbsp;&nbsp;
                                        <label>Bet Amount:</label>
                                        <input type="number" id="limit-amount" min="1" max="100" style={{ width: '80px', fontSize: '20px' }} />
                                        <span className="money-unit">(USDT)</span>&nbsp;&nbsp;
                                        <label>Leverage:</label>
                                        <input type="number" id="limit-leverage" min="1" max="300" value="1" style={{ width: '50px', fontSize: '20px' }} />
                                        &nbsp;&nbsp;
                                        <label>Limit Price:</label>
                                        <input type="number" id="limit-price" style={{ width: '100px', fontSize: '20px' }} />
                                        <span className="money-unit">(USDT)</span>&nbsp;&nbsp;
                                        <button id="limit-long-button" className="playbutttton" style={{ marginTop: '15px' }} onClick={() => futuresTrading("long", "limit")}>Long</button>&nbsp;&nbsp;
                                        <button id="limit-short-button" className="playbutttton" style={{ marginTop: '15px' }} onClick={() => futuresTrading("short", "limit")}>Short</button>&nbsp;&nbsp;
                                    </div>
                                </div>
                                <h3 style={{ color: '#ff8c00' }}>Open Positions</h3>
                                <div id="futures-open-positions"></div>
                                <h3 style={{ color: '#ff8c00' }}>Open Orders</h3>
                                <div id="futures-open-orders"></div>
                                <h3 style={{ color: '#ff8c00' }}>Closed Positions</h3>
                                <div id="futures-closed-positions"></div>
                            </div>
                        )
                    }
                    {
                        activeTab === 'spot' && (
                            <div id="spot" className="tabcontent trading-panel">
                                <div id="spot-statistics"></div>
                                <br />
                                <div id="spot-assets-statistics"></div>
                                <div className="order-panel">
                                    <div>
                                        Asset Type:
                                        <select id="futures-asset-type" onChange={handleAssetTypeChange}>
                                            {
                                                assetTypes.map((item, index) => (
                                                    <option value={item} key={index}>{item}</option> // Make sure to return the JSX here
                                                ))
                                            }
                                        </select>&nbsp;&nbsp;&nbsp;
                                        <span className="money-type">Current Price:</span>
                                        <span id="spot-current-price" className="money-value">Loading...</span>
                                        <span className="money-unit">USDT</span>&nbsp;&nbsp;&nbsp;&nbsp;
                                    </div>
                                    <div>
                                        <label style={{ color: 'rgb(255, 0, 0)', fontSize: '24px' }}>Market: </label>&nbsp;&nbsp;
                                        <label>Amount:</label>
                                        <input type="number" id="spot-market-amount" min="1" max="100" style={{ width: '80px', fontSize: '20px' }} />
                                        <span className="money-unit" id="spot-market-unit"></span>&nbsp;&nbsp;
                                        <button id="market-buy-button" className="playbutttton" style={{ marginTop: '15px' }}>Buy</button>&nbsp;&nbsp;
                                        <button id="market-sell-button" className="playbutttton" style={{ marginTop: '15px' }}>Sell</button>
                                    </div>
                                    <div>
                                        <label style={{ color: 'rgb(255, 0, 0)', fontSize: '24px' }}>Limit: </label>&nbsp;&nbsp;
                                        <label>Amount:</label>
                                        <input type="number" id="spot-limit-amount" min="1" max="100" style={{ width: '80px', fontSize: '20px' }} />
                                        <span className="money-unit" id="spot-limit-unit"></span>&nbsp;&nbsp;
                                        <label>Price:</label>
                                        <input type="number" id="spot-limit-price" min="1" max="100" style={{ width: '80px', fontSize: '20px' }} />
                                        <span className="money-unit">(USDT)</span>&nbsp;&nbsp;
                                        <button id="limit-buy-button" className="playbutttton" style={{ marginTop: '15px' }}>Buy</button>&nbsp;&nbsp;
                                        <button id="limit-sell-button" className="playbutttton" style={{ marginTop: '15px' }}>Sell</button>
                                    </div>
                                </div>
                                <h3 style={{ color: '#ff8c00' }}>Open Positions</h3>
                                <div id="spot-open-positions"></div>
                                <h3 style={{ color: '#ff8c00' }}>Open Orders</h3>
                                <div id="spot-open-orders"></div>
                                <h3 style={{ color: '#ff8c00' }}>Closed Positions</h3>
                                <div id="spot-closed-positions"></div>
                            </div>
                        )
                    }
                </div>
                {/* Partial Closing Modal */}
                {showPartialModal && (
                    <div id="partial-closing-modal" className="modal">
                        <div className="modal-content">
                            <span className="close" onClick={closePartialClosingModal}>
                                &times;
                            </span>
                            <h2 style={{ color: '#16171a' }}>Partial Closing</h2>
                            <br />
                            <p style={{ color: '#16171a', fontSize: '20px' }}>
                                <input
                                    id="particalClosingPercent"
                                    type="number"
                                    min="1"
                                    max="100"
                                    defaultValue="100"
                                />
                                %&nbsp;&nbsp;
                                <button onClick={() => setShowPartialModal(false)}>
                                    Confirm
                                </button>
                            </p>
                        </div>
                    </div>
                )}
                {/* Transfer USDT Modal */}
                {showTransferModal && (
                    <div id="transfer-USDT-modal" className="modal">
                        <div className="modal-content">
                            <span className="close" onClick={closeTransferUSDTModal}>
                                &times;
                            </span>
                            <h2 style={{ color: '#16171a' }}>USDT Transfer</h2>
                            <br />
                            <p style={{ color: '#16171a', fontSize: '20px' }}>
                                <span>Mode:</span>
                                <select name="transferType" id="transfer-USDT-type">
                                    <option value="fromFutures">Futures -&gt; Spot</option>
                                    <option value="fromSpot">Spot -&gt; Futures</option>
                                </select>
                                <br />
                                <span>Amount:</span>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    id="transfer-USDT-amount"
                                    style={{ fontSize: '20px', margin: '10px' }}
                                />
                                <span className="money-unit">(USDT)</span>
                                <br />
                                <button onClick={handleTransferUSDT}>
                                    Transfer
                                </button>
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Trading;
