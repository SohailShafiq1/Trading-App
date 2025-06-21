import React, { useEffect, useState } from 'react';

export default function AdminPaymentInfo() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeNetwork, setActiveNetwork] = useState('TRC'); // Default to TRC
  const tronAddress = "TTuh3Sou6PX5fRDypDWH4UKJpejusKoPYK";
  const binanceAddress = "YOUR_BSC_ADDRESS_HERE"; // Replace with your Binance Smart Chain address
  const BSCSCAN_API_KEY = "YOUR_BSCSCAN_API_KEY"; // Get from https://bscscan.com/apis

  // Fetch transactions based on active network
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (activeNetwork === 'TRC') {
          // Fetch TRON transactions
          const [trxData, trc20Data] = await Promise.all([
            fetch(`https://api.trongrid.io/v1/accounts/${tronAddress}/transactions?limit=50&order_by=block_timestamp,desc&only_confirmed=true`, {
              headers: { "TRON-PRO-API-KEY": "26c64bce-a843-4ce2-a3bc-62fbd83ba3a4" }
            }).then(res => res.json()),
            fetch(`https://api.trongrid.io/v1/accounts/${tronAddress}/transactions/trc20?limit=50&order_by=block_timestamp,desc&only_confirmed=true`, {
              headers: { "TRON-PRO-API-KEY": "26c64bce-a843-4ce2-a3bc-62fbd83ba3a4" }
            }).then(res => res.json())
          ]);

          const allTxs = [
            ...(trxData.data || []),
            ...(trc20Data.data || []),
          ]
            .filter(tx => (tx.to === tronAddress) || (tx.to_address === tronAddress))
            .sort((a, b) => new Date(b.block_timestamp) - new Date(a.block_timestamp));

          setTransactions(allTxs.slice(0, 50));
        } else if (activeNetwork === 'BINANCE') {
          // Fetch BSC transactions (both BNB and BEP-20 tokens)
          const response = await fetch(
            `https://api.bscscan.com/api?module=account&action=txlist&address=${binanceAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${BSCSCAN_API_KEY}`
          );
          const data = await response.json();

          if (data.status === "1") {
            // Filter only incoming transactions
            const incomingTxs = data.result.filter(tx => 
              tx.to.toLowerCase() === binanceAddress.toLowerCase()
            );
            setTransactions(incomingTxs.slice(0, 50));
          } else {
            throw new Error(data.message || "Failed to fetch BSC transactions");
          }
        }
      } catch (err) {
        setError("Failed to fetch transactions: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [activeNetwork, binanceAddress]);

  const formatValue = (value, decimals = 18) => {
    return (value / Math.pow(10, decimals)).toFixed(6);
  };

  if (loading) return <div>Loading transactions...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => setActiveNetwork('TRC')}
          className={`network-btn ${activeNetwork === 'TRC' ? 'active' : ''}`}
        >
          TRC (Tron)
        </button>
        <button 
          onClick={() => setActiveNetwork('BINANCE')}
          className={`network-btn ${activeNetwork === 'BINANCE' ? 'active' : ''}`}
        >
          Binance (BSC)
        </button>
      </div>

      <h2>Latest 50 Incoming Transactions (Newest First) - {activeNetwork}</h2>
      
      {transactions.length === 0 ? (
        <div>No incoming transactions found.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ padding: '12px', border: '1px solid #ddd' }}>Type</th>
              <th style={{ padding: '12px', border: '1px solid #ddd' }}>Amount</th>
              <th style={{ padding: '12px', border: '1px solid #ddd' }}>From</th>
              <th style={{ padding: '12px', border: '1px solid #ddd' }}>Time (UTC)</th>
              <th style={{ padding: '12px', border: '1px solid #ddd' }}>TX Hash</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.txID || tx.transaction_id || tx.hash} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                  {activeNetwork === 'TRC' ? 
                    (tx.type?.includes('TRC20') ? 'TRC20' : 'TRX') : 
                    (tx.contractAddress ? 'BEP-20' : 'BNB')}
                </td>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                  {activeNetwork === 'TRC' ? (
                    tx.amount ? `${formatValue(tx.amount, 6)} TRX` : 
                    tx.value ? `${formatValue(tx.value, 6)} USDT` : 'N/A'
                  ) : (
                    tx.value ? `${formatValue(tx.value)} ${tx.contractAddress ? 'Token' : 'BNB'}` : 'N/A'
                  )}
                </td>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                  <a 
                    href={
                      activeNetwork === 'TRC' ? 
                      `https://tronscan.org/#/address/${tx.from}` : 
                      `https://bscscan.com/address/${tx.from}`
                    } 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#3498db', textDecoration: 'none' }}
                  >
                    {tx.from?.slice(0, 6)}...{tx.from?.slice(-4)}
                  </a>
                </td>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                  {new Date(
                    activeNetwork === 'TRC' ? 
                    tx.block_timestamp : 
                    tx.timeStamp * 1000
                  ).toUTCString()}
                </td>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                  <a 
                    href={
                      activeNetwork === 'TRC' ? 
                      `https://tronscan.org/#/transaction/${tx.txID || tx.transaction_id}` : 
                      `https://bscscan.com/tx/${tx.hash}`
                    } 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#3498db', textDecoration: 'none' }}
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <style jsx>{`
        .network-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          background-color: #e0e0e0;
          color: #333;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        .network-btn.active {
          background-color: #4CAF50;
          color: white;
        }
        .network-btn:hover {
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
}