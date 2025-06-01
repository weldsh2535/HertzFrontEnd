import { gql } from '@apollo/client';

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        username
        email
        role
      }
    }
  }
`;

export const SIGNUP = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        id
        username
        email
        role
      }
    }
  }
`;

export const CREATE_POST = gql`
  mutation CreatePost($caption: String) {
    createPost(input: { caption: $caption }) {
      id
      mediaUrl
      mediaType
      caption
      user {
        id
        username
        avatar
      }
      createdAt
    }
  }
`;

export const LIKE_POST = gql`
  mutation LikePost($postId: ID!) {
    likePost(postId: $postId) {
      id
      likes {
        id
        username
      }
      likeCount
    }
  }
`;

export const RATE_POST = gql`
  mutation RatePost($postId: ID!, $rating: Int!) {
    ratePost(postId: $postId, rating: $rating) {
      id
      rating
    }
  }
`;

export const ADD_COMMENT = gql`
  mutation AddComment($postId: ID!, $text: String!) {
    addComment(postId: $postId, text: $text) {
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
`;

export const ADD_REPLY = gql`
  mutation AddReply($commentId: ID!, $text: String!) {
    addReply(commentId: $commentId, text: $text) {
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
`;


export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UpdateProfileInput!, $file: Upload) {
    updateProfile(input: $input, file: $file) {
      id
      username
      email
      bio
      avatar
    }
  }
`;