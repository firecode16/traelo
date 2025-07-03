import React from 'react';
import CustomerStack from '../stack/CustomerStack';
import BusinessStack from '../stack/BusinessStack';
import RiderStack from '../stack/RiderStack';
import AdminStack from '../stack/AdminStack';

const RoleRouter = ({ route }) => {
  const { role } = route.params;

  switch (role) {
    case 'CUSTOMER':
      return <CustomerStack />;
    case 'BUSINESS':
      return <BusinessStack />;
    case 'RIDER':
      return <RiderStack />;
    case 'ADMIN':
      return <AdminStack />;
    default:
      return null;
  }
};

export default RoleRouter;
