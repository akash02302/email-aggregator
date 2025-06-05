import { ChakraProvider, Box, Container } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import EmailList from './components/EmailList';
import EmailDetail from './components/EmailDetail';
import Header from './components/Header';

const queryClient = new QueryClient();

function App() {
  const [filters, setFilters] = useState({
    query: '',
    folder: '',
    category: ''
  });

  const handleFilterChange = (newFilters: typeof filters) => {
    console.log('Updating filters:', newFilters);
    setFilters(newFilters);
  };

  return (
    <ChakraProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Box minH="100vh" bg="gray.50">
            <Header onFilterChange={handleFilterChange} />
            <Container maxW="container.xl" py={8}>
              <Routes>
                <Route path="/" element={<EmailList filters={filters} />} />
                <Route path="/email/:emailId" element={<EmailDetail />} />
              </Routes>
            </Container>
          </Box>
        </Router>
      </QueryClientProvider>
    </ChakraProvider>
  );
}

export default App; 