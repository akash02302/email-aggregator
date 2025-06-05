import { Box, Flex, Input, Button, Heading, InputGroup, InputLeftElement, Select, HStack } from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface HeaderProps {
  onFilterChange?: (filters: { query: string; folder: string; category: string }) => void;
}

const Header = ({ onFilterChange }: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    query: '',
    folder: '',
    category: ''
  });
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = () => {
    const newFilters = { ...filters, query: searchQuery };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleFilterChange = (field: string, value: string) => {
    console.log(`Changing ${field} filter to:`, value);
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  // Available folders and categories
  const folders = [
    { value: 'INBOX', label: 'Inbox' },
    { value: 'SENT', label: 'Sent' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'SPAM', label: 'Spam' }
  ];

  const categories = [
    { value: 'Interested', label: 'Interested' },
    { value: 'Meeting Booked', label: 'Meeting Booked' },
    { value: 'Not Interested', label: 'Not Interested' },
    { value: 'Spam', label: 'Spam' },
    { value: 'Out of Office', label: 'Out of Office' }
  ];

  return (
    <Box bg="white" shadow="sm" py={4}>
      <Flex maxW="container.xl" mx="auto" px={4} alignItems="center" gap={4} flexWrap="wrap">
        <Heading size="md" cursor="pointer" onClick={() => navigate('/')}>
          Onebox
        </Heading>

        <InputGroup maxW="400px">
          <InputLeftElement>
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </InputGroup>

        <HStack spacing={4} flex={1}>
          <Select
            maxW="200px"
            placeholder="Select folder"
            value={filters.folder}
            onChange={(e) => handleFilterChange('folder', e.target.value)}
          >
            {folders.map(folder => (
              <option key={folder.value} value={folder.value}>{folder.label}</option>
            ))}
          </Select>

          <Select
            maxW="200px"
            placeholder="Select category"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>{category.label}</option>
            ))}
          </Select>

          <Button
            onClick={() => {
              setFilters({ query: '', folder: '', category: '' });
              setSearchQuery('');
              onFilterChange?.({ query: '', folder: '', category: '' });
            }}
          >
            Clear Filters
          </Button>
        </HStack>

        {location.pathname !== '/' && (
          <Button onClick={() => navigate('/')}>Back to List</Button>
        )}
      </Flex>
    </Box>
  );
};

export default Header; 