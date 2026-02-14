export interface Course {
  id: string;
  title: string;
  instructor: string;
  instructorImage?: string;
  thumbnail: string;
  rating: number;
  ratingCount: number;
  price: number;
  originalPrice?: number;
  category: string;
  duration: string;
  lessons: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  bestseller?: boolean;
}

export const courses: Course[] = [
  {
    id: '1',
    title: 'Complete Web Development Bootcamp 2025',
    instructor: 'Dr. Angela Yu',
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop',
    rating: 4.8,
    ratingCount: 15234,
    price: 3999,
    originalPrice: 15999,
    category: 'Development',
    duration: '65 hours',
    lessons: 450,
    level: 'Beginner',
    bestseller: true,
  },
  {
    id: '2',
    title: 'Machine Learning A-Z: AI & Python',
    instructor: 'Kirill Eremenko',
    thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=600&h=400&fit=crop',
    rating: 4.7,
    ratingCount: 12890,
    price: 4799,
    originalPrice: 15199,
    category: 'Data Science',
    duration: '44 hours',
    lessons: 320,
    level: 'Intermediate',
    bestseller: true,
  },
  {
    id: '3',
    title: 'React - The Complete Guide 2025',
    instructor: 'Maximilian Schwarzmüller',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&h=400&fit=crop',
    rating: 4.9,
    ratingCount: 18456,
    price: 3599,
    originalPrice: 12799,
    category: 'Development',
    duration: '52 hours',
    lessons: 380,
    level: 'Intermediate',
    bestseller: true,
  },
  {
    id: '4',
    title: 'UI/UX Design Masterclass',
    instructor: 'Daniel Walter Scott',
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop',
    rating: 4.6,
    ratingCount: 8765,
    price: 3199,
    originalPrice: 10399,
    category: 'Design',
    duration: '28 hours',
    lessons: 180,
    level: 'Beginner',
  },
  {
    id: '5',
    title: 'Python for Data Science & Machine Learning',
    instructor: 'Jose Portilla',
    thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=600&h=400&fit=crop',
    rating: 4.8,
    ratingCount: 21543,
    price: 4399,
    originalPrice: 14399,
    category: 'Data Science',
    duration: '38 hours',
    lessons: 290,
    level: 'Beginner',
    bestseller: true,
  },
  {
    id: '6',
    title: 'Advanced JavaScript Concepts',
    instructor: 'Andrei Neagoie',
    thumbnail: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=600&h=400&fit=crop',
    rating: 4.7,
    ratingCount: 9876,
    price: 3999,
    originalPrice: 11999,
    category: 'Development',
    duration: '25 hours',
    lessons: 200,
    level: 'Advanced',
  },
  {
    id: '7',
    title: 'Digital Marketing Complete Course',
    instructor: 'Robin & Jesper',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop',
    rating: 4.5,
    ratingCount: 6543,
    price: 2799,
    originalPrice: 7999,
    category: 'Marketing',
    duration: '20 hours',
    lessons: 150,
    level: 'Beginner',
  },
  {
    id: '8',
    title: 'AWS Certified Solutions Architect',
    instructor: 'Stephane Maarek',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=400&fit=crop',
    rating: 4.9,
    ratingCount: 14321,
    price: 5199,
    originalPrice: 15999,
    category: 'Cloud Computing',
    duration: '48 hours',
    lessons: 350,
    level: 'Intermediate',
    bestseller: true,
  },
];

export const categories = [
  { name: 'Development', count: 1234, icon: '💻' },
  { name: 'Business', count: 856, icon: '📊' },
  { name: 'Design', count: 654, icon: '🎨' },
  { name: 'Marketing', count: 432, icon: '📱' },
  { name: 'Data Science', count: 567, icon: '📈' },
  { name: 'Photography', count: 234, icon: '📷' },
  { name: 'Music', count: 189, icon: '🎵' },
  { name: 'Health & Fitness', count: 321, icon: '💪' },
];
