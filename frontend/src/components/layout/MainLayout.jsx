import PropTypes from 'prop-types';

const MainLayout = ({ sidebar, children }) => {
    return (

        <div className="flex h-screen w-screen bg-gray-100 overflow-hidden">

            <aside className="w-80 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
                {sidebar}
            </aside>

            <main className="flex-1 flex flex-col h-full relative overflow-hidden">
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