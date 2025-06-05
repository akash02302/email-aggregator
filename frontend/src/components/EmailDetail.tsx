import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Textarea,
  useToast,
  Divider,
  Heading
} from '@chakra-ui/react';
import { format } from 'date-fns';
import { fetchEmailById, updateEmailCategory, generateReply } from '../services/api';
import { Email, EmailCategory } from '../types/email';

const EmailDetail = () => {
  const { emailId } = useParams<{ emailId: string }>();
  const [replyContext, setReplyContext] = useState('');
  const toast = useToast();

  const { data: email, isLoading } = useQuery({
    queryKey: ['email', emailId],
    queryFn: () => fetchEmailById(emailId!)
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ category }: { category: EmailCategory }) =>
      updateEmailCategory(emailId!, category),
    onSuccess: () => {
      toast({
        title: 'Category updated',
        status: 'success',
        duration: 2000
      });
    }
  });

  const generateReplyMutation = useMutation({
    mutationFn: () => generateReply(emailId!, replyContext),
    onSuccess: (data) => {
      setReplyContext(data.reply);
      toast({
        title: 'Reply generated',
        status: 'success',
        duration: 2000
      });
    }
  });

  if (isLoading || !email) {
    return <Box>Loading...</Box>;
  }

  const categories: EmailCategory[] = [
    'Interested',
    'Meeting Booked',
    'Not Interested',
    'Spam',
    'Out of Office'
  ];

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

  return (
    <Box bg="white" p={6} rounded="lg" shadow="sm">
      <VStack align="stretch" spacing={6}>
        <Box>
          <Heading size="lg">{email.subject}</Heading>
          <Text color="gray.600" mt={2}>
            From: {email.from}
          </Text>
          <Text color="gray.600">
            Date: {format(new Date(email.date), 'PPpp')}
          </Text>
          {email.category && (
            <Badge colorScheme={getCategoryColor(email.category)} mt={2}>
              {email.category}
            </Badge>
          )}
        </Box>

        <Divider />

        <Box>
          <Text whiteSpace="pre-wrap">{email.textBody || email.htmlBody}</Text>
        </Box>

        <Divider />

        <Box>
          <Heading size="md" mb={4}>
            AI Features
          </Heading>
          <VStack align="stretch" spacing={4}>
            <Box>
              <Text fontWeight="bold" mb={2}>
                Categorize Email
              </Text>
              <HStack spacing={2}>
                {categories.map((category) => (
                  <Button
                    key={category}
                    size="sm"
                    colorScheme={getCategoryColor(category)}
                    variant={email.category === category ? 'solid' : 'outline'}
                    onClick={() => updateCategoryMutation.mutate({ category })}
                    isLoading={updateCategoryMutation.isPending}
                  >
                    {category}
                  </Button>
                ))}
              </HStack>
            </Box>

            <Box>
              <Text fontWeight="bold" mb={2}>
                AI Reply Suggestion
              </Text>
              <VStack align="stretch" spacing={2}>
                <Textarea
                  placeholder="Enter context for reply (e.g., meeting availability, product details)"
                  value={replyContext}
                  onChange={(e) => setReplyContext(e.target.value)}
                  rows={3}
                />
                <Button
                  colorScheme="blue"
                  onClick={() => generateReplyMutation.mutate()}
                  isLoading={generateReplyMutation.isPending}
                >
                  Generate Reply
                </Button>
              </VStack>
            </Box>

            {email.aiSummary && (
              <Box>
                <Text fontWeight="bold" mb={2}>
                  AI Summary
                </Text>
                <Text>{email.aiSummary}</Text>
              </Box>
            )}
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default EmailDetail; 