import axios from 'axios';

// Spring Boot Backend එක දුවන URL එක (http://localhost:8080)
const API = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🔐 Login API එකට කතා කරන මෙතඩ් එක
export const loginUser = async (nicNumber, password) => {
  try {
    // Backend එකේ UserController එකට POST රික්වෙස්ට් එකක් යවනවා
    const response = await API.post('/users/login', { nicNumber, password });
    return response.data; // ලොගින් සාර්ථක නම් යූසර්ගේ විස්තර සහ ROLE එක මෙතනින් රිටර්න් වෙනවා
  } catch (error) {
    // මොකක් හරි එරර් එකක් ආවොත් (වැරදි පාස්වර්ඩ් වගේ) ඒක Frontend එකට පාස් කරනවා
    throw error.response ? error.response.data : 'Server Connection Failed!';
  }
};

export default API;
