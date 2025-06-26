import React from 'react';
import CustomerStack from '../stack/CustomerStack';
import BusinessStack from '../stack/BusinessStack';
import RiderStack from '../stack/RiderStack';
import AdminStack from '../stack/AdminStack';

const RoleRouter = ({ route }) => {
  const { role } = route.params;

  switch (role) {
    case 'Customer':
      return <CustomerStack />;
    case 'Business':
      return <BusinessStack />;
    case 'Rider':
      return <RiderStack />;
    case 'Admin':
      return <AdminStack />;
    default:
      return null;
  }
};

export default RoleRouter;
