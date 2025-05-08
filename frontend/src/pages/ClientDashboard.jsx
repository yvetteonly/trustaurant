import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { abi } from "../contracts/Trustaurant.json";
import "../styles/ClientDashboard.css";

function ClientDashboard() {
  const [meals, setMeals] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [balance, setBalance] = useState('0');
  const [walletBalance, setWalletBalance] = useState('0');
  const [account, setAccount] = useState('');
  const [loading, setLoading] = useState(false);

  const contractAddress = '0x3Aa5ebB10DC797CAC828524e59A333d0A371443c';

  const getContract = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(contractAddress, abi, signer);
  };

  useEffect(() => {
    const init = async () => {
      try {
        if (typeof window.ethereum !== 'undefined') {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contract = new ethers.Contract(contractAddress, abi, signer);
          
          // Get connected account
          const address = await signer.getAddress();
          setAccount(address);

          // Load initial data
          const mealsData = await contract.viewMeals();
          const myRequestsData = await contract.getMyRequests();
          const trustBalance = await contract.getMyBalance();
          const ethBalance = await provider.getBalance(address);

          setMeals(mealsData);
          setMyRequests(myRequestsData);
          setBalance(ethers.formatEther(trustBalance));
          setWalletBalance(ethers.formatEther(ethBalance));

          // Setup event listeners
          contract.on("RequestProcessed", async (requestId, approved) => {
            const status = approved ? "approved" : "denied";
            alert(`Your meal request has been ${status}!`);
            await loadData(); // Refresh data
          });

          // Listen for account changes
          window.ethereum.on('accountsChanged', async (accounts) => {
            if (accounts.length > 0) {
              const newAddress = accounts[0];
              setAccount(newAddress);
              await loadData();
            }
          });
        }
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };

    init();
    return () => {
      // Cleanup event listeners
      const contract = getContract();
      contract.then(c => c.removeAllListeners());
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
      }
    };
  }, []);

  const loadData = async () => {
    try {
      const contract = await getContract();
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Get all updated data
      const myRequestsData = await contract.getMyRequests();
      const trustBalance = await contract.getMyBalance();
      const ethBalance = await provider.getBalance(account);

      setMyRequests(myRequestsData);
      setBalance(ethers.formatEther(trustBalance));
      setWalletBalance(ethers.formatEther(ethBalance));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const depositFunds = async (e) => {
    e.preventDefault();
    const amount = e.target.amount.value;
    try {
      const contract = await getContract();
      const tx = await contract.deposit({ value: ethers.parseEther(amount) });
      await tx.wait();
      
      await loadData(); // Refresh all balances
      alert('Deposit successful!');
      e.target.reset();
    } catch (error) {
      console.error('Error depositing funds:', error);
      alert('Failed to deposit funds. Please try again.');
    }
  };

  const requestMeal = async (mealId, mealPrice) => {
    if (window.confirm('Are you sure you want to request this meal?')) {
      setLoading(true);
      try {
        const contract = await getContract();
        const tx = await contract.requestMeal(mealId);
        await tx.wait();
        
        await loadData(); // Refresh all balances
        alert('Request sent! Pending admin approval.');
      } catch (error) {
        console.error('Error requesting meal:', error);
        alert('Failed to request meal. Please ensure you have sufficient balance.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="client-dashboard">
      <header className="dashboard-header">
        <div className="header-container">
          <h1>Welcome to Trustaurant</h1>
          <div className="wallet-info">
            <div className="wallet-card">
              <h3>Account Details</h3>
              <p><strong>Wallet Address:</strong> {account}</p>
              <p><strong>Wallet Balance:</strong> {walletBalance} ETH</p>
              <p><strong>Trustaurant Balance:</strong> {balance} ETH</p>
            </div>
          </div>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="dashboard-section deposit-section">
          <div className="section-header">
            <h2>Deposit Funds</h2>
          </div>
          <div className="section-content">
            <form onSubmit={depositFunds} className="deposit-form">
              <div className="form-group">
                <label htmlFor="amount">Amount to Deposit (ETH):</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  step="0.001"
                  placeholder="Enter amount in ETH"
                  required
                />
              </div>
              <button type="submit" className="deposit-button">Deposit Funds</button>
            </form>
          </div>
        </section>

        <section className="dashboard-section meals-section">
          <div className="section-header">
            <h2>Available Meals</h2>
          </div>
          <div className="section-content">
            <div className="meals-grid">
              {meals.length === 0 ? (
                <p className="no-data-message">No meals available at the moment.</p>
              ) : (
                meals.map((meal, index) => (
                  meal.name && (
                    <div key={index} className="meal-card">
                      <div className="meal-header">
                        <h3>{meal.name}</h3>
                        <span className={meal.available ? "status-available" : "status-unavailable"}>
                          {meal.available ? "Available" : "Unavailable"}
                        </span>
                      </div>
                      <div className="meal-details">
                        <p className="price"><strong>Price:</strong> {ethers.formatEther(meal.price)} ETH</p>
                        <p className="meal-id"><strong>Meal ID:</strong> {index}</p>
                      </div>
                      <button
                        className="request-button"
                        onClick={() => requestMeal(index, meal.price)}
                        disabled={loading || !meal.available}
                      >
                        {loading ? "Processing..." : "Request Meal"}
                      </button>
                    </div>
                  )
                ))
              )}
            </div>
          </div>
        </section>

        <section className="dashboard-section requests-section">
          <div className="section-header">
            <h2>My Meal Requests</h2>
          </div>
          <div className="section-content">
            {myRequests.length === 0 ? (
              <p className="no-data-message">You haven't made any requests yet.</p>
            ) : (
              <div className="requests-table-container">
                <table className="requests-table">
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Meal</th>
                      <th>Status</th>
                      <th>Date Requested</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myRequests.map((request, index) => (
                      <tr key={index} className={request.processed ? (request.approved ? "approved-row" : "denied-row") : "pending-row"}>
                        <td>{index}</td>
                        <td>{meals[request.mealId]?.name || `Meal #${request.mealId}`}</td>
                        <td>
                          <span className={`status-badge ${request.processed ? (request.approved ? "status-approved" : "status-denied") : "status-pending"}`}>
                            {request.processed 
                              ? (request.approved ? 'Approved' : 'Denied')
                              : 'Pending'
                            }
                          </span>
                        </td>
                        <td>{new Date().toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="dashboard-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Trustaurant</h4>
            <p>Blockchain-powered restaurant ordering system</p>
          </div>
          <div className="footer-section">
            <h4>Contract Address</h4>
            <p>{contractAddress}</p>
          </div>
          <div className="footer-section">
            <h4>Support</h4>
            <p>help@trustaurant.com</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Trustaurant. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default ClientDashboard;