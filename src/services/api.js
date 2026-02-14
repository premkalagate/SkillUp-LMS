// API Service for SkillUp MERN Application
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('auth-token');
};

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    // Handle non-JSON responses
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (parseError) {
        // If JSON parsing fails, try to get text
        const text = await response.text();
        throw new Error(text || `HTTP error! status: ${response.status}`);
      }
    } else {
      const text = await response.text();
      throw new Error(text || `HTTP error! status: ${response.status}`);
    }

    if (!response.ok) {
      // Extract error message from response - try multiple formats
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      if (data) {
        // Try different error message fields
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.error) {
          errorMessage = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
        } else if (data.message) {
          errorMessage = typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
        } else if (data.msg) {
          errorMessage = typeof data.msg === 'string' ? data.msg : JSON.stringify(data.msg);
        } else if (data.originalError) {
          errorMessage = typeof data.originalError === 'string' ? data.originalError : JSON.stringify(data.originalError);
        } else {
          // If no clear error field, try to extract from the object
          const errorStr = JSON.stringify(data);
          // If it's a short string, use it; otherwise use a generic message
          errorMessage = errorStr.length < 200 ? errorStr : `Server error (${response.status})`;
        }
        
        // Handle array of error details
        if (data.details) {
          if (Array.isArray(data.details)) {
            errorMessage += ': ' + data.details.join(', ');
          } else if (typeof data.details === 'string') {
            errorMessage += ': ' + data.details;
          }
        }
      }
      
      // Log the full error for debugging - log the actual object
      console.error(`API Error [${response.status}] for ${url}:`, data);
      console.error('Error data type:', typeof data);
      console.error('Error data keys:', data ? Object.keys(data) : 'No data');
      console.error('Error stringified:', JSON.stringify(data, null, 2));
      
      // Make sure we have a meaningful error message
      if (errorMessage === `HTTP error! status: ${response.status}` && data) {
        // If we couldn't extract a message, use the stringified data (limited length)
        const dataStr = JSON.stringify(data);
        errorMessage = dataStr.length < 300 ? dataStr : `Server error (${response.status}). Check console for details.`;
      }
      
      // Create error object with more info
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`API request error for ${url}:`, error);
    console.error('Error type:', typeof error);
    console.error('Error keys:', error instanceof Error ? Object.keys(error) : 'Not an Error object');
    
    // If it's already an Error object with a meaningful message, re-throw it
    if (error instanceof Error) {
      // If message is not the default, use it
      if (error.message && error.message !== 'Something went wrong' && !error.message.includes('HTTP error!')) {
        throw error;
      }
      
      // Try to extract from error.data
      if (error.data) {
        const errorMsg = error.data.error || error.data.message || error.data.msg;
        if (errorMsg) {
          throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
        }
      }
      
      // If we have a status, include it in the message
      if (error.status) {
        throw new Error(`Server error (${error.status}): ${error.message || 'Unknown error'}`);
      }
    }
    
    // Fallback: create a new error
    const errorMsg = error?.message || error?.toString() || 'Something went wrong';
    throw new Error(errorMsg);
  }
};

// Auth API functions
export const authApi = {
  signUp: (email, password, fullName, role) =>
    apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName, role }),
    }),
  signIn: (email, password) =>
    apiRequest('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getCurrentUser: () => apiRequest('/auth/me'),
};

// User API functions
export const userApi = {
  getProfile: (userId) => apiRequest(`/users/profile/${userId}`),
  updateProfile: (userId, profileData) => 
    apiRequest(`/users/profile/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),
  getUsers: (params) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/users${queryParams ? `?${queryParams}` : ''}`);
  },
  getUserRole: (userId) => apiRequest(`/users/role/${userId}`),
};

// Course API functions
export const courseApi = {
  getCourses: (params = {}) => {
    // Convert params object to URLSearchParams
    // Backend accepts both camelCase and snake_case, so we can pass as-is
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    return apiRequest(`/courses${queryString ? `?${queryString}` : ''}`);
  },
  getCourse: (courseId) => apiRequest(`/courses/${courseId}`),
  getCourseLessons: (courseId) => apiRequest(`/courses/${courseId}/lessons`),
  createCourse: (courseData) => 
    apiRequest('/courses', {
      method: 'POST',
      body: JSON.stringify(courseData),
    }),
  updateCourse: (courseId, courseData) => 
    apiRequest(`/courses/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify(courseData),
    }),
  deleteCourse: (courseId) => 
    apiRequest(`/courses/${courseId}`, { method: 'DELETE' }),
  getFeaturedCourses: () => apiRequest('/courses/featured'),
  getCoursesByCategory: (category) => apiRequest(`/courses/category/${category}`),
};

// Payment API functions
export const paymentApi = {
  createOrder: (orderData) => 
    apiRequest('/razorpay/create-order', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),
  verifyPayment: (paymentData) => 
    apiRequest('/razorpay/verify-payment', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    }),
  createPayment: (paymentData) => 
    apiRequest('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    }),
  updatePayment: (paymentId, paymentData) => 
    apiRequest(`/payments/${paymentId}`, {
      method: 'PUT',
      body: JSON.stringify(paymentData),
    }),
  getPayment: (paymentId) => apiRequest(`/payments/${paymentId}`),
  getUserPayments: (userId) => apiRequest(`/payments/user/${userId}`),
  getCoursePayments: (courseId) => apiRequest(`/payments/course/${courseId}`),
  getPayments: (params) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/payments${queryParams ? `?${queryParams}` : ''}`);
  },
};

// Coupon API functions
export const couponApi = {
  createCoupon: (couponData) => 
    apiRequest('/coupons', {
      method: 'POST',
      body: JSON.stringify(couponData),
    }),
  getCoupons: (params) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/coupons${queryParams ? `?${queryParams}` : ''}`);
  },
  getCoupon: (couponId) => apiRequest(`/coupons/${couponId}`),
  updateCoupon: (couponId, couponData) => 
    apiRequest(`/coupons/${couponId}`, {
      method: 'PUT',
      body: JSON.stringify(couponData),
    }),
  deleteCoupon: (couponId) => 
    apiRequest(`/coupons/${couponId}`, { method: 'DELETE' }),
  validateCoupon: (validationData) => 
    apiRequest('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify(validationData),
    }),
};

// Review API functions
export const reviewApi = {
  getCourseReviews: (courseId) => apiRequest(`/reviews/course/${courseId}`),
  getUserReviews: (userId) => apiRequest(`/reviews/user/${userId}`),
  getReview: (reviewId) => apiRequest(`/reviews/${reviewId}`),
  createReview: (reviewData) => 
    apiRequest('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    }),
  updateReview: (reviewId, reviewData) => 
    apiRequest(`/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(reviewData),
    }),
  deleteReview: (reviewId) => 
    apiRequest(`/reviews/${reviewId}`, { method: 'DELETE' }),
  getAverageRating: (courseId) => apiRequest(`/reviews/course/${courseId}/average`),
};

// Enrollment API functions
export const enrollmentApi = {
  getUserEnrollments: (userId) => apiRequest(`/enrollments/user/${userId}`),
  getCourseEnrollments: (courseId) => apiRequest(`/enrollments/course/${courseId}`),
  getEnrollment: (enrollmentId) => apiRequest(`/enrollments/${enrollmentId}`),
  createEnrollment: (enrollmentData) => 
    apiRequest('/enrollments', {
      method: 'POST',
      body: JSON.stringify(enrollmentData),
    }),
  completeEnrollment: (enrollmentId) => 
    apiRequest(`/enrollments/${enrollmentId}/complete`, {
      method: 'PUT',
    }),
  deleteEnrollment: (enrollmentId) => 
    apiRequest(`/enrollments/${enrollmentId}`, { method: 'DELETE' }),
  getCourseEnrollmentCount: (courseId) => apiRequest(`/enrollments/course/${courseId}/count`),
  getUserEnrollmentCount: (userId) => apiRequest(`/enrollments/user/${userId}/count`),
};

// Lesson API functions
export const lessonApi = {
  getCourseLessons: (courseId) => apiRequest(`/lessons/course/${courseId}`),
  getLesson: (lessonId) => apiRequest(`/lessons/${lessonId}`),
  createLesson: (lessonData) => 
    apiRequest('/lessons', {
      method: 'POST',
      body: JSON.stringify(lessonData),
    }),
  updateLesson: (lessonId, lessonData) => 
    apiRequest(`/lessons/${lessonId}`, {
      method: 'PUT',
      body: JSON.stringify(lessonData),
    }),
  deleteLesson: (lessonId) => 
    apiRequest(`/lessons/${lessonId}`, { method: 'DELETE' }),
  deleteLessonsByCourse: (courseId) => 
    apiRequest(`/lessons/course/${courseId}`, { method: 'DELETE' }),
  reorderLessons: (courseId, lessons) => 
    apiRequest(`/lessons/course/${courseId}/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ lessons }),
    }),
};

// Lesson Progress API functions
export const lessonProgressApi = {
  getLessonProgress: (userId, courseId) => apiRequest(`/lesson-progress/user/${userId}/course/${courseId}`),
  getLessonProgressForLesson: (userId, lessonId) => apiRequest(`/lesson-progress/user/${userId}/lesson/${lessonId}`),
  updateLessonProgress: (progressData) => 
    apiRequest('/lesson-progress', {
      method: 'POST',
      body: JSON.stringify(progressData),
    }),
  markLessonComplete: (lessonProgressId) => 
    apiRequest(`/lesson-progress/complete/${lessonProgressId}`, {
      method: 'PUT',
    }),
  batchUpdateProgress: (progressData) => 
    apiRequest('/lesson-progress/batch-update', {
      method: 'PUT',
      body: JSON.stringify(progressData),
    }),
};

// Certificate API functions
export const certificateApi = {
  getUserCertificates: (userId) => apiRequest(`/certificates/user/${userId}`),
  getCourseCertificates: (courseId) => apiRequest(`/certificates/course/${courseId}`),
  getCertificate: (certificateId) => apiRequest(`/certificates/${certificateId}`),
  getCertificateByNumber: (certificateNumber) => apiRequest(`/certificates/number/${certificateNumber}`),
  createCertificate: (certificateData) => 
    apiRequest('/certificates', {
      method: 'POST',
      body: JSON.stringify(certificateData),
    }),
  deleteCertificate: (certificateId) => 
    apiRequest(`/certificates/${certificateId}`, { method: 'DELETE' }),
};

// Admin API functions
export const adminApi = {
  getAdminProfile: (userId) => apiRequest(`/admin/profile/${userId}`),
  updateAdminProfile: (userId, profileData) => 
    apiRequest(`/admin/profile/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),
  getDashboardAnalytics: () => apiRequest('/admin/dashboard'),
  getAnalytics: (params) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/admin/analytics${queryParams ? `?${queryParams}` : ''}`);
  },
};

export default {
  userApi,
  courseApi,
  paymentApi,
  couponApi,
  reviewApi,
  enrollmentApi,
  lessonApi,
  certificateApi,
  adminApi,
};