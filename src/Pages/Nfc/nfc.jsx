import{ useState } from 'react';

const FelicaTransactionReader = () => {
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState(null);

  const readNfcData = async () => {
    try {
      if ("NDEFReader" in window) {
        const ndef = new NDEFReader();
        await ndef.scan();

        ndef.onreading = (event) => {
          const decoder = new TextDecoder();
          let balanceFound = false;

          for (const record of event.message.records) {
            if (record.recordType === "text") {
              const data = decoder.decode(record.data);

              // Check if data contains balance information
              if (data.includes("Balance")) {
                setBalance(data.split(":")[1].trim());
                balanceFound = true;
              } else {
                // Parse and store transaction data; limit to last 10 records
                setTransactions((prev) => [...prev, data].slice(-10));
              }
            }
          }

          if (!balanceFound) setError("Balance not found on this card.");
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
          Dhaka MRT Card Reader
        </h2>
        <button
          onClick={readNfcData}
          className="w-full bg-blue-500 text-white font-medium py-2 rounded-lg hover:bg-blue-600 transition duration-300"
        >
          Scan Card
        </button>
        {error && <p className="mt-4 text-red-500 text-sm text-center">{error}</p>}
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Balance</h3>
          {balance !== null ? (
            <p className="text-2xl text-green-600 font-semibold">{balance} BDT</p>
          ) : (
            <p className="text-gray-500 text-sm">Balance not found.</p>
          )}
        </div>
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
