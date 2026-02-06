try {
  require('react-native-gifted-charts');
  console.log('Success');
} catch (e) {
  console.error('Error detail:');
  console.error(e.message);
  console.error(e.stack);
}
