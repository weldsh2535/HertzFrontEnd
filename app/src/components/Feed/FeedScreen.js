import React, { useState, useRef, useCallback } from 'react';
import { View, FlatList, Dimensions, StyleSheet, Animated, ActivityIndicator, Text } from 'react-native';
import { useQuery } from '@apollo/client';
import { GET_FEED } from '../../graphql/queries';
import FeedItem from './FeedItem';
import LoadingIndicator from '../Common/LoadingIndicator';
import ErrorMessage from '../Common/ErrorMessage';
import { colors } from '../../utils/styles';

const { height, width } = Dimensions.get('window');

const CenteredLoading = () => (
  <View style={styles.centeredLoadingContainer}>
    <ActivityIndicator size="large" color={colors.golden} />
    <Text style={styles.loadingText}>Loading feed...</Text>
  </View>
);

export default function FeedScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const flatListRef = useRef(null);
  const loadingProgress = useRef(new Animated.Value(0)).current;
  const loadingTimeout = useRef(null);
  
  const { loading, error, data, fetchMore, refetch } = useQuery(GET_FEED, {
    variables: { limit: 5, page: 1 },
    notifyOnNetworkStatusChange: true,
  });

  const animateLoading = useCallback((toValue, duration = 500) => {
    if (loadingTimeout.current) {
      clearTimeout(loadingTimeout.current);
    }

    return new Promise((resolve) => {
      Animated.timing(loadingProgress, {
        toValue,
        duration,
        useNativeDriver: false,
      }).start(resolve);
    });
  }, [loadingProgress]);

  const resetLoading = useCallback(async () => {
    await animateLoading(1, 200);
    loadingTimeout.current = setTimeout(() => {
      loadingProgress.setValue(0);
    }, 300);
  }, [animateLoading, loadingProgress]);

  React.useEffect(() => {
    const shouldShowLoading = loading || isRefreshing || isLoadingMore;
    
    if (shouldShowLoading) {
      animateLoading(0.8);
    } else {
      resetLoading();
    }

    return () => {
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
      }
    };
  }, [loading, isRefreshing, isLoadingMore, animateLoading, resetLoading]);

  const handleViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 90, 
    waitForInteraction: false,
  }).current;

  const loadMore = useCallback(async () => {
    if (!loading && !isLoadingMore && data?.getFeed?.length === page * 5) {
      try {
        setIsLoadingMore(true);
        await animateLoading(0.4);
        
        await fetchMore({
          variables: {
            limit: 5,
            page: page + 1,
          },
          updateQuery: (prev, { fetchMoreResult }) => {
            if (!fetchMoreResult) return prev;
            return {
              getFeed: [...prev.getFeed, ...fetchMoreResult.getFeed],
            };
          },
        });
        
        setPage(p => p + 1);
        await resetLoading();
      } catch (error) {
        console.error('Error loading more:', error);
        await resetLoading();
      } finally {
        setIsLoadingMore(false);
      }
    }
  }, [loading, isLoadingMore, data, page, fetchMore, animateLoading, resetLoading]);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await animateLoading(0.4);
      setPage(1);
      await refetch({ page: 1 });
      await resetLoading();
    } catch (error) {
      console.error('Error refreshing:', error);
      await resetLoading();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch, animateLoading, resetLoading, isRefreshing]);

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

  if (loading && !data) {
    return (
      <View style={styles.container}>
        <Animated.View style={[
          styles.progressBar,
          {
            opacity: loadingProgress.interpolate({
              inputRange: [0, 0.1, 0.5, 1],
              outputRange: [0, 1, 1, 0],
            }),
            width: loadingProgress.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%']
            }),
            transform: [{
              translateX: loadingProgress.interpolate({
                inputRange: [0, 0.4, 1],
                outputRange: ['-50%', '0%', '0%']
              })
            }]
          }
        ]} />
        <CenteredLoading />
      </View>
    );
  }
  
  if (error) return <ErrorMessage message={error.message} />;

  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.progressBar,
        {
          opacity: loadingProgress.interpolate({
            inputRange: [0, 0.1, 0.5, 1],
            outputRange: [0, 1, 1, 0],
          }),
          width: loadingProgress.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%']
          }),
          transform: [{
            translateX: loadingProgress.interpolate({
              inputRange: [0, 0.4, 1],
              outputRange: ['-50%', '0%', '0%']
            })
          }]
        }
      ]} />
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
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        initialNumToRender={3}
        maxToRenderPerBatch={5}
        windowSize={5}
        getItemLayout={getItemLayout}
        removeClippedSubviews={true}
        ListFooterComponent={
          isLoadingMore ? <LoadingIndicator /> : null
        }
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
  progressBar: {
    height: 2,
    backgroundColor: '#fff',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  centeredLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  loadingText: {
    color: '#FF3B7F',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    letterSpacing: 0.5,
  },
});