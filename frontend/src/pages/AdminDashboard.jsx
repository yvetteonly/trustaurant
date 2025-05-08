import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { abi } from "../contracts/Trustaurant.json";
import "../styles/AdminDashboard.css";

function AdminDashboard() {
  const [meals, setMeals] = useState([]);
  const [requests, setRequests] = useState([]);
  const [systemBalance, setSystemBalance] = useState('0');
  const [newMeal, setNewMeal] = useState({ name: '', price: '' });
  const [loading, setLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [account, setAccount] = useState('');

  const contractAddress = '0x3Aa5ebB10DC797CAC828524e59A333d0A371443c';

  const getContract = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(contractAddress, abi, signer);
  };

  const addMeal = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const contract = await getContract();
      const priceInWei = ethers.parseEther(newMeal.price);
      const tx = await contract.addMeal(newMeal.name, priceInWei);
      await tx.wait();
      
      // Refresh meals list
      const mealsData = await contract.viewMeals();
      setMeals(mealsData);
      setNewMeal({ name: '', price: '' });
      alert('Meal added successfully!');
    } catch (error) {
      console.error('Error adding meal:', error);
      alert('Failed to add meal. Please try again.');
    }
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      try {
        if (typeof window.ethereum !== 'undefined') {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contract = new ethers.Contract(contractAddress, abi, signer);

          // Load initial data
          const mealsData = await contract.viewMeals();
          const requestsData = await contract.viewAllRequests();
          const balance = await contract.getMyBalance();

          setMeals(mealsData);
          setRequests(requestsData);
          setSystemBalance(ethers.formatEther(balance));
        }
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };

    init();
  }, []);

  const toggleMealAvailability = async (mealId, currentStatus) => {
    try {
      const contract = await getContract();
      const tx = await contract.setMealAvailability(mealId, !currentStatus);
      await tx.wait();
      
      // Refresh meals list
      const mealsData = await contract.viewMeals();
      setMeals(mealsData);
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };

  const handleRequest = async (requestId, approve) => {
    try {
      const contract = await getContract();
      const tx = await (approve ? contract.approveRequest(requestId) : contract.denyRequest(requestId));
      await tx.wait();
      
      // Refresh requests list
      const requestsData = await contract.viewAllRequests();
      setRequests(requestsData);
    } catch (error) {
      console.error('Error handling request:', error);
    }
  };

  // Add withdraw function (remove the duplicate state declaration)
  const withdrawEth = async (e) => {
    e.preventDefault();
    try {
      // Set loading state
      setLoading(true);
      
      // Validate amount
      if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
        alert('Please enter a valid amount greater than 0');
        return;
      }

      const contract = await getContract();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // Get contract owner address and check if current user is owner
      const ownerAddress = await contract.owner();
      console.log("Current account:", address);
      console.log("Contract owner:", ownerAddress);
      
      if (address.toLowerCase() !== ownerAddress.toLowerCase()) {
        alert('Only the restaurant owner can withdraw funds');
        return;
      }

      // Check balance before withdrawal
      const ownerBalance = await contract.balances(ownerAddress);
      console.log("Owner balance in contract:", ethers.formatEther(ownerBalance));
      
      const amountInWei = ethers.parseEther(withdrawAmount);
      console.log("Amount to withdraw (wei):", amountInWei.toString());
      console.log("Amount to withdraw (ETH):", withdrawAmount);
      
      if (amountInWei > ownerBalance) {
        alert(`Insufficient balance. Available: ${ethers.formatEther(ownerBalance)} ETH`);
        return;
      }

      // Check if contract has enough actual ETH
      const contractBalance = await provider.getBalance(contractAddress);
      console.log("Contract ETH balance:", ethers.formatEther(contractBalance));
      
      if (amountInWei > contractBalance) {
        alert(`Contract doesn't have enough ETH. Available: ${ethers.formatEther(contractBalance)} ETH`);
        return;
      }

      // Perform withdrawal with higher gas limit
      console.log("Attempting withdrawal...");
      const tx = await contract.withdrawTo(amountInWei, address, {
        gasLimit: 500000 // Increased gas limit
      });
      
      console.log("Transaction sent:", tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);
      
      if (receipt.status === 1) {
        // Transaction successful
        const newBalance = await contract.balances(ownerAddress);
        setSystemBalance(ethers.formatEther(newBalance));
        setWithdrawAmount('');
        alert('Withdrawal successful! Check your MetaMask wallet.');
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error('Error withdrawing ETH:', error);
      
      // Handle specific error cases with more detailed logging
      console.log("Error details:", error);
      
      if (error.message.includes("insufficient funds")) {
        alert('Insufficient funds for gas. Make sure you have ETH for transaction fees.');
      } else if (error.message.includes("Not authorized")) {
        alert('Only the restaurant owner can withdraw funds');
      } else if (error.message.includes("user rejected")) {
        alert('Transaction was rejected in MetaMask');
      } else if (error.message.includes("execution reverted")) {
        alert('Transaction reverted. The contract may not have enough actual ETH.');
      } else if (error.message.includes("Transfer failed")) {
        alert('Transfer failed. The contract may not have enough actual ETH.');
      } else {
        alert(`Withdrawal failed: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Add delete meal function
  const deleteMeal = async (mealId) => {
    try {
      // Set loading state
      setLoading(true);
      
      // Get the contract
      const contract = await getContract();
      
      // Log the meal ID for debugging
      console.log("Attempting to delete meal ID:", mealId);
      
      // Proceed with deletion - use try/catch specifically for the transaction
      try {
        const tx = await contract.deleteMeal(mealId);
        console.log("Transaction sent:", tx.hash);
        await tx.wait();
        console.log("Transaction confirmed");
        
        // Refresh meals list
        const mealsData = await contract.viewMeals();
        setMeals(mealsData.filter(meal => meal.name !== ''));
        alert('Meal deleted successfully!');
      } catch (txError) {
        console.error("Transaction error:", txError);
        // Check for specific error types
        if (txError.message.includes("Invalid meal ID")) {
          alert("Invalid meal ID. This meal may have already been deleted.");
        } else if (txError.message.includes("Not authorized")) {
          alert("You are not authorized to delete meals. Please connect with the admin account.");
        } else {
          alert(`Transaction failed: ${txError.message}`);
        }
      }
    } catch (error) {
      console.error('Error in delete meal function:', error);
      alert('Failed to delete meal. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>Restaurant Admin Dashboard</h1>
        <div className="wallet-info">
          <div className="wallet-detail">
            <span>Connected Account:</span>
            <span className="account-address">{account}</span>
          </div>
          <div className="wallet-detail">
            <span>System Balance:</span>
            <span className="balance-info">{systemBalance} ETH</span>
          </div>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="section add-meal-section">
          <div className="section-header">
            <h2>Add New Meal</h2>
          </div>
          <div className="section-content">
            <form onSubmit={addMeal} className="add-meal-form">
              <input
                type="text"
                placeholder="Meal Name"
                value={newMeal.name}
                onChange={(e) => setNewMeal({...newMeal, name: e.target.value})}
                required
              />
              <input
                type="number"
                step="0.001"
                placeholder="Price (ETH)"
                value={newMeal.price}
                onChange={(e) => setNewMeal({...newMeal, price: e.target.value})}
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Meal'}
              </button>
            </form>
          </div>
        </section>

        <section className="section meals-section">
          <div className="section-header">
            <h2>Current Meals</h2>
          </div>
          <div className="section-content">
            <div className="meals-list">
              {meals && meals.filter(meal => meal.name !== '').map((meal, index) => (
                <div key={index} className="meal-item">
                  <div className="meal-header">
                    <h3>{meal.name}</h3>
                    <span className={meal.available ? "status-badge available" : "status-badge unavailable"}>
                      {meal.available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <div className="meal-details">
                    <p className="meal-price">{ethers.formatEther(meal.price)} ETH</p>
                    <p className="meal-id">ID: {index}</p>
                  </div>
                  <div className="meal-actions">
                    <button 
                      className="toggle-button"
                      onClick={() => toggleMealAvailability(index, meal.available)}
                    >
                      {meal.available ? 'Mark Unavailable' : 'Mark Available'}
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => {
                        if(window.confirm('Are you sure you want to delete this meal?')) {
                          deleteMeal(index);
                        }
                      }}
                      disabled={loading}
                    >
                      {loading ? 'Deleting...' : 'Delete Meal'}
                    </button>
                  </div>
                </div>
              ))}
              {meals.filter(meal => meal.name !== '').length === 0 && (
                <p className="no-data-message">No meals available. Add your first meal!</p>
              )}
            </div>
          </div>
        </section>

        <section className="section requests-section">
          <div className="section-header">
            <h2>Customer Requests</h2>
          </div>
          <div className="section-content">
            {requests.length > 0 ? (
              <div className="requests-table">
                <table>
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Client Address</th>
                      <th>Meal</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request, index) => (
                      <tr key={index} className={request.processed ? (request.approved ? "row-approved" : "row-denied") : "row-pending"}>
                        <td>{index}</td>
                        <td className="client-address">{request.client}</td>
                        <td>{meals[request.mealId]?.name || `Meal #${request.mealId}`}</td>
                        <td>
                          <span className={`status ${request.processed ? (request.approved ? "approved" : "denied") : "pending"}`}>
                            {request.processed 
                              ? (request.approved ? 'Approved' : 'Denied')
                              : 'Pending'
                            }
                          </span>
                        </td>
                        <td>
                          {!request.processed && (
                            <div className="request-actions">
                              <button onClick={() => handleRequest(index, true)}>
                                Approve
                              </button>
                              <button onClick={() => handleRequest(index, false)}>
                                Deny
                              </button>
                            </div>
                          )}
                          {request.processed && (
                            <span className="processed-label">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-data-message">No customer requests yet.</p>
            )}
          </div>
        </section>

        <section className="section withdraw-section">
          <div className="section-header">
            <h2>Withdraw Funds</h2>
          </div>
          <div className="section-content">
            <p className="balance-display">Current Balance: <span className="balance-amount">{systemBalance} ETH</span></p>
            <form onSubmit={withdrawEth} className="withdraw-form">
              <input
                type="number"
                step="0.001"
                placeholder="Amount to withdraw (ETH)"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Processing...' : 'Withdraw to My Wallet'}
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer className="dashboard-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Trustaurant Admin</h4>
            <p>Blockchain-powered restaurant management</p>
          </div>
          <div className="footer-section">
            <h4>Contract Details</h4>
            <p>Address: {contractAddress}</p>
          </div>
          <div className="footer-section">
            <h4>Support</h4>
            <p>admin@trustaurant.com</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Trustaurant. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default AdminDashboard;