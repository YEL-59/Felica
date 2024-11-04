import React, { useState } from 'react';

const FelicaTransactionReader = () => {
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(null);

  const readNfcData = async () => {
    try {
      if ("NDEFReader" in window) {
        const ndef = new NDEFReader();
        await ndef.scan();

        ndef.onreading = (event) => {
          const decoder = new TextDecoder();
          for (const record of event.message.records) {
            if (record.recordType === "text") {
              const transactionData = decoder.decode(record.data);
              // Store only the last 10 transactions
              setTransactions((prev) => [...prev, transactionData].slice(-10));
            }
          }
        };
      } else {
        setError("NFC is not supported on this device.");
      }
    } catch (err) {
      setError(`Error reading NFC: ${err.message}`);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
          FeliCa NFC Transaction Reader
        </h2>
        <button
          onClick={readNfcData}
          className="w-full bg-blue-500 text-white font-medium py-2 rounded-lg hover:bg-blue-600 transition duration-300"
        >
          Scan Card
        </button>
        {error && (
          <p className="mt-4 text-red-500 text-sm text-center">{error}</p>
        )}
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Transactions</h3>
          <ul className="space-y-2">
            {transactions.length > 0 ? (
              transactions.map((transaction, index) => (
                <li
                  key={index}
                  className="bg-gray-100 p-3 rounded-md text-sm text-gray-800"
                >
                  {transaction}
                </li>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center">
                No transactions found.
              </p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FelicaTransactionReader;
