import { gql } from '@apollo/client';

export const GET_FEED = gql`
  query GetFeed {
    getFeed {
      id
      mediaUrl
      mediaType
      caption
      createdAt
 
      user {
        id
        username
        avatar
      }
    }
  }
`;

export const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      username
      email
      bio
      avatar
      posts {
        id
        mediaUrl
        mediaType
        caption
        createdAt
        likeCount
        commentCount
      }
    }
  }
`;

export const GET_POST_COMMENTS = gql`
  query GetPostComments($postId: ID!) {
    postComments(postId: $postId) {
      id
      text
      createdAt
      user {
        id
        username
        avatar
      }
      replies {
        id
        text
        createdAt
        user {
          id
          username
          avatar
        }
      }
    }
  }
`;