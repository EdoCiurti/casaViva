import React from 'react';
import { Spinner } from 'react-bootstrap';



const LoadingSpinner = () => {
    return (
        <div className="loading-spinner">
            <Spinner animation="border" role="status">
                <span className="sr-only"></span>
            </Spinner>
        </div>
    );
};

export default LoadingSpinner;