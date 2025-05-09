import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { useNavigate } from 'react-router-dom'
import './App.css'

function App() {
  const [account, setAccount] = useState('')
  const navigate = useNavigate()
  const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
  const contractOwner = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        })
        setAccount(accounts[0])
        
        // Check if connected account is contract owner
        if (accounts[0].toLowerCase() === contractOwner.toLowerCase()) {
          navigate('/admin-dashboard')
        } else {
          navigate('/client-dashboard')
        }
      } else {
        alert('Please install MetaMask!')
      }
    } catch (error) {
      console.error('Error connecting wallet:', error)
    }
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Trustaurant</h1>
        <nav>
          <ul>
            <li>Home</li>
            <li>About</li>
            <li>Contact</li>
          </ul>
        </nav>
      </header>

      <main className="welcome-section">
        <section className="hero-section">
          <h2>Welcome to Trustaurant</h2>
          <p>Connect your wallet to get started</p>
          <button 
            className="connect-wallet-btn"
            onClick={connectWallet}
          >
            {account ? 'Connected' : 'Connect Wallet'}
          </button>
        </section>

        <section className="features-section">
          <h3>Our Features</h3>
          <div className="features-grid">
            <div className="feature-card">
              <h4>Secure Transactions</h4>
              <p>All transactions are secured by blockchain technology</p>
            </div>
            <div className="feature-card">
              <h4>Easy Ordering</h4>
              <p>Order your favorite meals with just a few clicks</p>
            </div>
            <div className="feature-card">
              <h4>Transparent System</h4>
              <p>Track your orders and payments in real-time</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Contact Us</h4>
            <p>Email: info@trustaurant.com</p>
            <p>Phone: (123) 456-7890</p>
          </div>
          <div className="footer-section">
            <h4>Follow Us</h4>
            <p>Twitter</p>
            <p>Facebook</p>
            <p>Instagram</p>
          </div>
          <div className="footer-section">
            <h4>Legal</h4>
            <p>Terms of Service</p>
            <p>Privacy Policy</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Trustaurant. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
