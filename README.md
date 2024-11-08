NFC Transaction Parser
A JavaScript utility to parse transaction data from an NFC card (Bangladesh MRT Pass) response.

Features
Parses raw byte data from an NFC card response.
Extracts and decodes relevant transaction details, such as timestamp, station information, and balance.
Supports validation of status flags and response integrity.
How It Works
The utility reads the raw NFC card data, validates its structure, and parses individual transaction blocks into a human-readable format.
