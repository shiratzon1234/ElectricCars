import { StyleSheet } from 'react-native';

export default StyleSheet.create({
        container: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f0ffff',
        },
        title: {
          fontSize: 20,
          marginBottom: 20,
          fontWeight: 'bold',
          color : '#00008b',
        },
        input: {
          height: 40,
          borderColor: '#ccc',
          borderWidth: 1,
          marginBottom: 15,
          width: 200,
          paddingLeft: 10,
          borderRadius: 5,
        },
        buttonWrapper: {
          marginTop: 20,
          fontWeight: 'bold' ,
          //backgroundColor: '#00008b',
          backgroundColor: 'transparent',
          borderWidth: 4,           // עובי המסגרת
          borderColor: '#00008b',   // צבע המסגרת
          //borderRadius: 30,  
        },
      });