import React, { useState, useRef, useCallback } from 'react';
import { View, FlatList, Dimensions, StyleSheet } from 'react-native';
import { useQuery } from '@apollo/client';
import { GET_FEED } from '../../graphql/queries';
import FeedItem from './FeedItem';
import LoadingIndicator from '../Common/LoadingIndicator';
import ErrorMessage from '../Common/ErrorMessage';
import { colors } from '../../utils/styles';

const { height } = Dimensions.get('window');

export default function FeedScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const { loading, error, data, fetchMore, refetch } = useQuery(GET_FEED);

  const handleViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 90, 
    waitForInteraction: false,
  }).current;

  const loadMore = useCallback(() => {
    if (data?.getFeed?.length) {
      fetchMore({
        variables: {
          offset: data.getFeed.length,
        },
      });
    }
  }, [data]);

  const renderItem = useCallback(({ item, index }) => (
    <FeedItem 
      item={item} 
      isActive={index === currentIndex} 
      index={index}
    />
  ), [currentIndex]);

  const getItemLayout = useCallback((data, index) => ({
    length: height,
    offset: height * index,
    index,
  }), []);

  if (loading && !data) return <LoadingIndicator />;
  if (error) return <ErrorMessage message={error.message} />;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={data?.getFeed || []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshing={loading}
        onRefresh={refetch}
        initialNumToRender={3}
        maxToRenderPerBatch={5}
        windowSize={5}
        getItemLayout={getItemLayout}
        removeClippedSubviews={true}
         horizontal={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black', 
  },
});