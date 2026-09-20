import { useEffect, useState } from "react";

// const API_URL = "http://localhost:5000/api";
const API_URL = "https://ine-assignment-5joy.onrender.com/api";


function App() {
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [trackedProducts, setTrackedProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    const searchProducts = async () => {
        if (!search.trim()) {
            setSearchResults([]);
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/products/search?q=${encodeURIComponent(search)}`
            );

            const data = await response.json();

            setSearchResults(data);
        } catch (error) {
            console.error("Search failed:", error);
        }
    };

    const fetchTrackedProducts = async () => {
        try {
            const response = await fetch(
                `${API_URL}/products/tracked`
            );

            const data = await response.json();

            setTrackedProducts(data);
        } catch (error) {
            console.error(
                "Failed to load tracked products:",
                error
            );
        }
    };

    const trackProduct = async (product) => {
        try {
            setLoading(true);

            const response = await fetch(
                `${API_URL}/products/track`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        product_name: product.product_name,
                        product_url: product.product_url,
                        image_url: product.image_url
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error);
            }

            await fetchTrackedProducts();

            alert("Product is now being tracked.");

        } catch (error) {
            console.error(
                "Failed to track product:",
                error
            );

            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrackedProducts();
    }, []);

    return (
        <div>
            <h1>Product Price Tracker</h1>

            <div>
                <input
                    type="text"
                    placeholder="Search product name..."
                    value={search}
                    onChange={(event) =>
                        setSearch(event.target.value)
                    }
                />

                <button onClick={searchProducts}>
                    Search
                </button>
            </div>

            <h2>Search Results</h2>

            {searchResults.length === 0 ? (
                <p>No products found.</p>
            ) : (
                searchResults.map((product) => (
                    <div key={product.id}>
                        <h3>
                            {product.product_name}
                        </h3>

                        <p>
                            {product.product_url}
                        </p>

                        <button
                            onClick={() =>
                                trackProduct(product)
                            }
                            disabled={loading}
                        >
                            Track Product
                        </button>
                    </div>
                ))
            )}

            <hr />

            <h2>Tracked Products</h2>

            {trackedProducts.length === 0 ? (
                <p>No products are being tracked.</p>
            ) : (
                trackedProducts.map((product) => (
                    <div key={product.id}>
                        <h3>
                            {product.product_name}
                        </h3>

                        <p>
                            {product.product_url}
                        </p>

                        <p>
                            Product ID: {product.id}
                        </p>
                    </div>
                ))
            )}
        </div>
    );
}

export default App;