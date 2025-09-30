import React from 'react'
import styles from "./GridBox.module.css";



const GridBox = ({name}) => {
  return (
    <div className={styles.box}>
        {name}
      
    </div>
  )
}

export default GridBox;
