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
  mutation Signup($username: String!, $email: String!, $password: String!) {
    signup(username: $username, email: $email, password: $password) {
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
  mutation CreatePost($file: Upload!, $caption: String) {
    createPost(file: $file, caption: $caption) {
      id
      mediaUrl
      mediaType
      caption
      user {
        id
        username
        avatar
      }
    }
  }
`;

export const LIKE_POST = gql`
  mutation LikePost($postId: ID!) {
    likePost(postId: $postId) {
      id
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
  mutation UpdateProfile($username: String, $email: String, $bio: String, $avatar: String) {
    updateProfile(username: $username, email: $email, bio: $bio, avatar: $avatar) {
      id
      username
      email
      bio
      avatar
    }
  }
`;