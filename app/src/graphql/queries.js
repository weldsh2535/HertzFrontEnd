import { gql } from '@apollo/client';

export const GET_FEED = gql`
  query GetFeed($limit: Int, $page: Int) {
    getFeed(limit: $limit, page: $page) {
      id
      mediaUrl
      mediaType
      caption
      createdAt
      likeCount
      commentCount
      ratings {
        value
      }
      user {
        id
        username
        avatar
      }
    }
  }
`;

export const GET_USER = gql`
  query GetUser($userId: ID!) {
    getUser(id: $userId) {
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

// export const GET_POST_COMMENTS = gql`
//   query GetPostComments($postId: ID!) {
//     postComments(postId: $postId) {
//       id
//       text
//       createdAt
//       user {
//         id
//         username
//         avatar
//       }
//     }
//   }
// `;

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
  }
}
`;