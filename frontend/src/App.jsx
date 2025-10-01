import React,{useState} from 'react'
import { BrowserRouter, Routes, Route,Link } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar'
import GridBox from './components/Navbar/GridBox.jsx';
import styles from './components/Navbar/GridBox.module.css';
import PolicyPage from './Pages/PolicyPage/PolicyForm.jsx';
import VehiclePage from './Pages/VehiclePage/VehicleForm.jsx';
import OwnerPage from './Pages/OwnerPage/OwnerForm.jsx';
function HomePage()  {

  const [theme,setTheme]=useState('light');
   const boxNames = ['owner','vehicle' ,'policies', 'accidents', 'payment', 'news'];
  return (
    
    <div className={`container ${theme}`}>
      <Navbar theme={theme} setTheme={setTheme}/>
      
      <div className={styles.gridLayout}>
        {boxNames.map((name) => (
          <Link to={`/${name}`} key={name} className={styles.box}>
          <GridBox key={name} name={name} />
          </Link>
        ))}
      </div>
    </div>
    )
}
function App(){
  return (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<HomePage/>}/>
      <Route path="/policies" element={<PolicyPage/>}/>
      <Route path="/vehicle" element={<VehiclePage/>}/>
      <Route path="/owner" element={<OwnerPage/>}/>
    </Routes>
  </BrowserRouter>
  );
}

export default App
