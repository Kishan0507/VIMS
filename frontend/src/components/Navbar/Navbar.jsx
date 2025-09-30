import React from 'react'
import styles from './Navbar.Module.css'
import logo from '../../assets/carlogo.png'
import search_icon_light from '../../assets/search-w.png'
import search_icon_dark from '../../assets/search-b.png'
import toogle_light from '../../assets/night.png'
import toogle_dark from '../../assets/day.png'
const Navbar = ({theme,setTheme}) => {

  const toggle_mode=()=>{
    theme=='light'? setTheme('dark'):setTheme('light')
  }
  return (
    <div className={`${styles.navbar} ${theme === 'dark' ? styles.dark : ''}`}>
    
        <img src={logo} alt="" className={styles.logo}/>
        <ul>
            <li>Home</li>
            <li>AboutUs</li>
            <li>Login</li>
        </ul>
        <div className={styles.searchBox}>
            <input type="text" placeholder='search'/>
            <img src={theme == 'light'? search_icon_light: search_icon_dark} alt="" className={styles.search}/>
        </div>
        <img onClick={()=>{toggle_mode()}}src={ theme=='light'?toogle_light:toogle_dark} alt='' className={styles.toggleIcon}/>
      
    </div>
  )
}

export default Navbar
