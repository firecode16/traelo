import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import { COLOR } from '../../constants/Color';
import CATEGORY from '../../constants/Category';
import {
  INIT_CURRENT_LOCATION,
  DATA_CATEGORY,
  DATA_BUSINESS,
} from '../../data/FakeData';

const HomeScreen = ({ navigation }) => {
  const SIZES = {
    // global sizes
    base: 8,
    font: 14,
    radius: 30,
    padding: 10,
    padding2: 12,
  };

  const [categories, setCategories] = React.useState(DATA_CATEGORY);
  const [selectedCategory, setSelectedCategory] = React.useState(null);
  const [business, setBusiness] = React.useState(DATA_BUSINESS);
  const [currentLocation, setCurrentLocation] = React.useState(
    INIT_CURRENT_LOCATION,
  );

  function onSelectCategory(category) {
    //filter business
    let businessList = DATA_BUSINESS.filter((a) =>
      a.categories.includes(category.id),
    );

    setBusiness(businessList);
    setSelectedCategory(category);
  }

  function getCategoryNameById(id) {
    let category = categories.filter((a) => a.id == id);
    if (category.length > 0) return category[0].name;
    return '';
  }

  function renderInitCategories() {
    const renderItem = ({ item }) => {
      return (
        <TouchableOpacity
          style={{
            padding: SIZES.padding,
            paddingBottom: 10,
            backgroundColor:
              selectedCategory?.id == item.id ? COLOR.orange : COLOR.white,
            borderRadius: 30,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: SIZES.padding,
            ...styles.shadow,
          }}
          onPress={() => onSelectCategory(item)}
        >
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 999,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor:
                selectedCategory?.id == item.id ? COLOR.white : COLOR.lightGray,
            }}
          >
            <Image
              source={item.icon}
              resizeMode="contain"
              style={{
                width: 45,
                height: 45,
              }}
            />
          </View>

          <Text
            style={{
              fontFamily: 'Poppins-Regular',
              fontSize: 12,
              padding: 10,
              color:
                selectedCategory?.id == item.id ? COLOR.white : COLOR.black,
            }}
          >
            {item.name}
          </Text>
        </TouchableOpacity>
      );
    };

    return (
      <View style={{ padding: SIZES.padding * 2, alignItems: 'center' }}>
        <Text
          style={{
            fontFamily: 'Poppins-SemiBold',
            fontSize: 20,
          }}
        >
          Categorías
        </Text>

        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => `${item.id}`}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: SIZES.padding * 2 }}
        />
      </View>
    );
  }

  function renderBusinessList() {
    const renderItem = ({ item }) => (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('BusinessDetail', {
            item,
            currentLocation,
          })
        }
      >
        {/* image */}
        <View
          style={{
            marginBottom: SIZES.padding,
          }}
        >
          <Image
            source={item.photo}
            resizeMode="cover"
            style={{
              width: '100%',
              height: 200,
              borderTopLeftRadius: 15,
              borderTopRightRadius: 15,
            }}
          />
        </View>

        <View style={{ padding: 10 }}>
          {/* business info: name + status in same line */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: 'Poppins-SemiBold',
                fontSize: 20,
                lineHeight: 30,
                flexShrink: 1, // evita desbordes en nombres largos
              }}
            >
              {item.name}
            </Text>

            <View
              style={{
                backgroundColor: item.isOpen
                  ? COLOR.openGreen
                  : COLOR.closedRed,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
                marginLeft: 10,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Poppins-SemiBold',
                  fontSize: 12,
                  color: item.isOpen ? COLOR.txtOpenGreen : COLOR.txtClosedRed,
                }}
              >
                {item.isOpen ? 'Abierto' : 'Cerrado'}
              </Text>
            </View>
          </View>

          <View
            style={{
              marginTop: SIZES.padding,
              flexDirection: 'row',
            }}
          >
            {/* rating */}
            <Image
              source={CATEGORY.star}
              style={{
                height: 20,
                width: 20,
                tintColor: COLOR.orange,
                marginRight: 10,
              }}
            />
            <Text
              style={{
                fontFamily: 'Poppins-Regular',
                fontSize: 15,
                lineHeight: 22,
              }}
            >
              {item.rating}
            </Text>

            {/* business name */}
            <View
              style={{
                flexDirection: 'row',
                marginLeft: 10,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Poppins-Regular',
                  fontSize: 15,
                  lineHeight: 22,
                }}
              >
                {item.businessName}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row' }}>
            <EvilIcons
              name="clock"
              size={21}
              color="black"
              style={{ marginRight: 3 }}
            />
            <Text
              style={{
                fontFamily: 'Poppins-Light',
                fontSize: 13,
                top: 2,
              }}
            >
              {item.duration}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );

    return (
      <FlatList
        data={business}
        keyExtractor={(item) => `${item.id}`}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingHorizontal: 12,
          paddingTop: 5,
          paddingBottom: 10,
        }}
        showsVerticalScrollIndicator={false}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar animated={true} style="light" />
      {renderInitCategories()}
      {renderBusinessList()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLOR.lightGray,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    lineHeight: 22,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  card: {
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#f5f5f5',
    borderRadius: 15,
    backgroundColor: COLOR.white,
    elevation: 3,
    shadowColor: '#000', // para iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});

export default HomeScreen;
