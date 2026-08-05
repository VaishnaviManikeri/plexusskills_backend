import axios from 'axios';

const testLogin = async () => {
  try {
    console.log('Testing login...');
    
    const response = await axios.post('http://localhost:5000/api/admin/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    console.log('✅ Login successful!');
    console.log('Response:', response.data);
    console.log('Token:', response.data.token);
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
  }
};

testLogin();