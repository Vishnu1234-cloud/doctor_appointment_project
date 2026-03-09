import React from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        // Log error to monitoring service if available here
        console.error('Frontend Error Caught:', error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                    <Card className="max-w-md w-full shadow-lg border-red-100">
                        <CardContent className="pt-8 pb-8 px-6 flex flex-col items-center text-center">
                            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-6">
                                <AlertTriangle className="h-8 w-8" />
                            </div>
                            <h2 className="text-2xl font-serif font-bold text-slate-800 mb-2">Oops! Something went wrong.</h2>
                            <p className="text-slate-500 mb-8 max-w-sm">
                                We're sorry, but the application encountered an unexpected error. Please try reloading the page.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 w-full">
                                <Button
                                    onClick={this.handleReload}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                >
                                    Reload Page
                                </Button>
                                <Button
                                    onClick={this.handleGoHome}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Go to Home
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
