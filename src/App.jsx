import { Routes, Route } from "react-router-dom";
import FelicaTransactionReader from "./Pages/Nfc/nfc";


function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<FelicaTransactionReader/>} />
      </Routes>
    </>
  );
}

export default App;
