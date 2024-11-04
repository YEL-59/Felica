import { useState, useEffect } from 'react';

function FelicaTransactionReader() {
  const [isNfcSupported, setIsNfcSupported] = useState(false);
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [status, setStatus] = useState("Waiting for NFC card...");

  useEffect(() => {
    // Check if Web NFC is supported
    if ('NDEFReader' in window) {
      setIsNfcSupported(true);
    } else {
      setStatus("Web NFC is not supported on this device/browser.");
    }
  }, []);

  const startReading = async () => {
    if (!isNfcSupported) return;

    try {
      const ndef = new NDEFReader();
      setStatus("Ready to scan...");

      // Start the scan
      await ndef.scan();
      ndef.onreading = (event) => {
        const { message } = event;
        console.log("NFC Message:", message); // Log the message object
        let parsedTransactions = [];

        for (const record of message.records) {
          if (record.recordType === "text") {
            const textDecoder = new TextDecoder();
            const decodedText = textDecoder.decode(record.data);
            console.log("Decoded Text:", decodedText); // Log the decoded text

            // Placeholder to simulate parsing transaction data
            const transaction = parseTransactionData(decodedText); 
            if (transaction) {
              parsedTransactions.push(transaction);
            }
          }
        }

        if (parsedTransactions.length > 0) {
          setTransactions(parsedTransactions);
          setBalance(parsedTransactions[0].balance); // Assume first transaction has balance
          setStatus("Transaction data read successfully.");
        } else {
          setStatus("No transaction data found.");
        }
      };

      ndef.onerror = (error) => {
        setStatus("Error reading NFC: " + error.message);
        console.error("NFC Read Error:", error); // Log the error
      };
    } catch (error) {
      setStatus("Error initializing NFC: " + error.message);
      console.error("NFC Initialization Error:", error); // Log the error
    }
  };

  const ByteParser = {
    toHexString(bytes) {
      return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join(' ').toUpperCase();
    },
  
    extractInt16(bytes, offset = 0) {
      return ((bytes[offset + 1] & 0xFF) << 8) | (bytes[offset] & 0xFF);
    },
  
    extractInt24(bytes, offset = 0) {
      return ((bytes[offset + 2] & 0xFF) << 16) | ((bytes[offset + 1] & 0xFF) << 8) | (bytes[offset] & 0xFF);
    },
  
    extractByte(bytes, offset) {
      return bytes[offset] & 0xFF;
    }
  };
  
  const parseTransactionData = (response) => {
    // Convert the response into a byte array
    const bytes = Uint8Array.from(response.split('').map(c => c.charCodeAt(0))); // response format 
    const transactions = [];
  
    if (bytes.length < 13) {
      console.error("Response too short");
      return transactions;
    }
  
    // Validate status flags
    const statusFlag1 = bytes[10];
    const statusFlag2 = bytes[11];
    if (statusFlag1 !== 0x00 || statusFlag2 !== 0x00) {
      console.error("Error reading card: Status flags", statusFlag1, statusFlag2);
      return transactions;
    }
  
    const numBlocks = bytes[12] & 0xFF;
    const blockData = bytes.slice(13);
  
    const blockSize = 16;
    if (blockData.length < numBlocks * blockSize) {
      console.error("Incomplete block data");
      return transactions;
    }
  
    // Iterate over each block to parse transaction details
    for (let i = 0; i < numBlocks; i++) {
      const offset = i * blockSize;
      const block = blockData.slice(offset, offset + blockSize);
      const transaction = parseTransactionBlock(block);
      transactions.push(transaction);
    }
  
    return transactions;
  };
  
  const getStationName = (stationCode) => {
    const stationMap = {
      10: "Motijheel",
      20: "Bangladesh Secretariat",
      25: "Dhaka University",
      30: "Shahbagh",
      35: "Karwan Bazar",
      40: "Farmgate",
      45: "Bijoy Sarani",
      50: "Agargaon",
      55: "Shewrapara",
      60: "Kazipara",
      65: "Mirpur 10",
      70: "Mirpur 11",
      75: "Pallabi",
      80: "Uttara South",
      85: "Uttara Center",
      90: "Uttara North"
    };

    return stationMap[stationCode] || `Unknown Station (${stationCode})`;
  };

  const decodeTimestamp = (timestampValue) => {
    const baseTimeMillis = Date.now() - (timestampValue * 60 * 1000); // Convert minutes to milliseconds
    const date = new Date(baseTimeMillis);
    return date.toISOString().slice(0, 16).replace("T", " "); // "yyyy-MM-dd HH:mm" format
  };

  const parseTransactionBlock = (block) => {
    if (block.length !== 16) {
      throw new Error("Invalid block size");
    }

    const fixedHeader = ByteParser.toHexString(block.slice(0, 4));
    const timestampValue = ByteParser.extractInt16(block, 4);
    const timestamp = decodeTimestamp(timestampValue);

    const transactionTypeBytes = block.slice(6, 8);
    const transactionType = ByteParser.toHexString(transactionTypeBytes);

    const fromStationCode = ByteParser.extractByte(block, 8);
    const toStationCode = ByteParser.extractByte(block, 10);
    const balance = ByteParser.extractInt24(block, 11);

    const fromStation = getStationName(fromStationCode);
    const toStation = getStationName(toStationCode);

    const trailingBytes = block.slice(14, 16);
    const trailing = ByteParser.toHexString(trailingBytes);

    return {
      fixedHeader,
      timestamp,
      transactionType,
      fromStation,
      toStation,
      balance,
      trailing
    };
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">Dhaka MRT Pass Reader</h1>
      <p className="mb-4 text-gray-700">{status}</p>
      
      {isNfcSupported && (
        <button 
          onClick={startReading}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Start NFC Scan
        </button>
      )}

      {balance && (
        <div className="mt-6 p-4 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold">Balance: {balance} Taka</h2>
        </div>
      )}

      {transactions.length > 0 && (
        <div className="mt-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
          <ul className="bg-white rounded-lg shadow-md divide-y divide-gray-200">
            {transactions.map((txn, index) => (
              <li key={index} className="p-4">
                <p className="font-medium">{txn.timestamp}</p>
                <p className="text-sm text-gray-600">
                  {txn.transactionType} - {txn.fromStation} to {txn.toStation}
                </p>
                <p className="text-sm">Balance after transaction: {txn.balance} Taka</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default FelicaTransactionReader;
