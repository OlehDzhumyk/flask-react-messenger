import PropTypes from 'prop-types';

const MainLayout = ({ sidebar, children }) => {
    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            {/* Sidebar Area - Fixed width */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                {sidebar}
            </div>

            {/* Main Content Area - Flexible */}
            <main className="flex-1 flex flex-col relative">
                {children}
            </main>
        </div>
    );
};

MainLayout.propTypes = {
    sidebar: PropTypes.node.isRequired,
    children: PropTypes.node.isRequired,
};

export default MainLayout;