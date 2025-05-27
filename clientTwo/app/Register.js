import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 20,
    marginBottom: 30,
    fontWeight: 'bold',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
    textAlign: "right",
    paddingRight: 10,
    borderRadius: 5,
  },
  buttonWrapper: {
    marginTop: 20,
    fontWeight: 'bold' ,
    //backgroundColor: '#008080',
    borderWidth: 4,           // עובי המסגרת
    borderColor: '#00008b',   // צבע המסגרת
    //borderRadius: 30,  
  },
});