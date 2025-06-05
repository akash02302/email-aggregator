import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
  Spinner,
  useToast
} from '@chakra-ui/react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { fetchEmails } from '../services/api';
import { Email, EmailCategory } from '../types/email';

interface EmailListProps {
  filters: {
    query: string;
    folder: string;
    category: string;
  };
}

const EmailList = ({ filters }: EmailListProps) => {
  const navigate = useNavigate();
  const toast = useToast();

  const { data: emails, isLoading, error } = useQuery({
    queryKey: ['emails', filters],
    queryFn: async () => {
      try {
        console.log('Fetching emails with filters:', filters);
        const result = await fetchEmails(filters);
        console.log('Fetched emails:', result);
        return result;
      } catch (err) {
        console.error('Error fetching emails:', err);
        throw err;
      }
    }
  });

  const getCategoryColor = (category: EmailCategory) => {
    switch (category) {
      case 'Interested':
        return 'green';
      case 'Meeting Booked':
        return 'blue';
      case 'Not Interested':
        return 'red';
      case 'Spam':
        return 'orange';
      case 'Out of Office':
        return 'gray';
      default:
        return 'gray';
    }
  };

  if (error) {
    console.error('Query error:', error);
    toast({
      title: 'Error loading emails',
      description: error instanceof Error ? error.message : 'Failed to load emails',
      status: 'error',
      duration: 5000,
      isClosable: true
    });
  }

  return (
    <Box>
      {isLoading ? (
        <Box display="flex" justifyContent="center" p={8}>
          <Spinner size="xl" />
        </Box>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Account</Th>
              <Th>From</Th>
              <Th>Subject</Th>
              <Th>Category</Th>
              <Th>Folder</Th>
              <Th>Date</Th>
            </Tr>
          </Thead>
          <Tbody>
            {emails?.map((email: Email) => (
              <Tr
                key={email.id}
                cursor="pointer"
                _hover={{ bg: 'gray.50' }}
                onClick={() => navigate(`/email/${email.id}`)}
              >
                <Td>
                  <Badge colorScheme="blue">
                    {email.accountId === 'account1' ? 'akashkumar02302@gmail.com' : 'akashkumar0203002@gmail.com'}
                  </Badge>
                </Td>
                <Td>{email.from}</Td>
                <Td>
                  <Text noOfLines={1}>{email.subject}</Text>
                </Td>
                <Td>
                  <Badge colorScheme={getCategoryColor(email.category)}>
                    {email.category}
                  </Badge>
                </Td>
                <Td>
                  <Badge variant="outline" colorScheme="gray">
                    {email.folder}
                  </Badge>
                </Td>
                <Td>{format(new Date(email.date), 'MMM d, yyyy')}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </Box>
  );
};

export default EmailList; 