var Tabs = ReactSimpleTabs;

// Event listener context
var APP = {};

var GameToggle = React.createClass({
    getDefaultProps: function () {
        // TODO: change in case of multiple events
        return {
            games:[{title:"64",value:"ssb64"},{title:"MELEE",value:"ssbm"},{title:"BRAWL",value:"ssbb"},{title:"SM4SH",value:"ssb4"}]
        };
    },
    
    getInitialState: function () {
        return { checked: this.props.games[0].value };
    },
    
    onChange: function (e) {
        this.setState({checked: e.target.value});
    },
    
    render: function () {
        var checked = this.state.checked;
        var createButton = function (game) {
            return (
            <div className="row" key={game.value}>
                <input type="radio" name="game" id={game.value} value={game.value} defaultChecked={checked === game.value} />
                <label htmlFor={game.value}>{game.title}</label>
            </div>);
        };
        
        return (
        <div className="row">
            <div className="col-xs-12">
                <form id="game-choice-form" onsubmit="return false;" onChange={this.onChange}>
                    {this.props.games.map(createButton)}
                </form>
            </div>
        </div>);
    }
});

var ResultTabs = React.createClass({
    handleBefore: function (e) {
        console.log("Results tabs handleBefore:", e);
        $(APP).trigger("resultTabChange", e);
    },
    render: function () {
        // TODO: replace with actual results
        return (
        <Tabs onBeforeChange={this.handleBefore}>
            <Tabs.Panel title="Results">
                <h2>How the Smashers placed</h2>
            </Tabs.Panel>
            <Tabs.Panel title="Standings">
                <h2>How well you did</h2>
            </Tabs.Panel>
        </Tabs>);
    }
});

var RightCol = React.createClass({
    mixins: [ReactFireMixin],
    
    componentWillMount: function () {
        // TODO: listen to Firebase changes for uid
    },

    componentDidMount: function () {
        // Add trigger to change content of RightCol depending on state of ActionTab
        $(APP).on("actionTabChange", this.onChangeActiveTab);
    },
    
    getInitialState: function () {
        return {activeActionTab: 1};
    },
    
    onChangeActiveTab: function (e, tab) {
        this.setState({activeActionTab: tab});
    },
    
    render: function () {
        if (this.state.activeActionTab == 1) {
            return (
            <div id="your-choices">
                <h4>Here are your picks:</h4>
                <SmasherList smashers={sampleData} pagination={{currPage: 0, totalPages: 0}} />
            </div>);
        } else if (this.state.activeActionTab == 2) {
            return (
            <ResultTabs />
            );
        }
        throw "Illegal state: " + this.state.activeActionTab;
    }
});

var ScoreSpreadTable = React.createClass({
    propTypes: {scoreSpread: React.PropTypes.array},
    render: function () {
        var createTR = function (s) {
            return <tr key={s.place}><td>{s.place}</td><td>{s.score}</td></tr>;
        };
        return (
        <table className="table table-hover">
            <thead>
                <tr>
                    <th>Place</th>
                    <th>Points</th>
                </tr>
            </thead>
            <tbody>
                {this.props.scoreSpread.map(createTR)}
            </tbody>
        </table>);        
    }
});

var SmasherDetail = React.createClass({
    mixins: [ReactFireMixin],
    // TODO: Prop for choose or remove button
    // TODO: Make another class without choose/remove btn
    componentWillMount: function () {
        // TODO: Bind popularity to Firebase
    },
    
    propTypes: {smasher: React.PropTypes.object},
    
    render: function () {
        var smasher = this.props.smasher;
        var scoreSpread = calculateScoreSpread(smasher.popularity);
        return (
        <li className="row">
            <div className="col-xs-12">
                <div className="row">
                    <div className="col-xs-4">
                        <div className="row">
                            <div className="col-xs-12">
                                {smasher.handle}
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-xs-12">
                                {smasher.location}
                            </div>
                        </div>
                    </div>
                    <div className="col-xs-4 text-center popularity">
                        {smasher.popularity}%
                    </div>
                    <div className="col-xs-4">
                        <div className="row">
                            <div className="col-xs-8">
                                <button type="button" className="btn btn-primary">CHOOSE</button>
                            </div>
                            <div className="col-xs-4">
                                <button type="button" className="btn btn-info btn-circle" data-toggle="collapse" data-target={"#" + smasher.id}>&#9660;</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div id={smasher.id} className="collapse">
                    <ScoreSpreadTable scoreSpread={scoreSpread} />
                </div>
            </div>
        </li>);
    }
});

var sampleData = [
    {handle: "Chillin", location: "Virginia", popularity: 45.6, id: "myb"},
    {handle: "Chudat", location: "Virginia", popularity: 50, id: "evo15"},
    {handle: "Zero", location: "Chile", popularity: 80, id: "scarf"},
    {handle: "Mew2king", location: "California", popularity: 69.6, id: "lolm2k"},
    {handle: "David", location: "Philly", popularity: 1.2, id:"jv5ed"}
];

var Pagination = React.createClass({
    getInitialState: function () {
        return { currPage: this.props.pagination.currPage, totalPages: this.props.pagination.totalPages };
    },
    
    handlePageChange: function (event, page) {
        // TODO set onChange function
        this.setState({ currPage: page });
    },

    update: function (paginationObj) {
        // Check if totalPages == 0 or is undefined
        if (paginationObj.totalPages) {
            // onPageClick attr need not be defined
            paginationObj.onPageClick = this.handlePageChange;
            var thisEl = React.findDOMNode(this);
            $(thisEl).twbsPagination(paginationObj);
            this.setState({ totalPages: paginationObj.totalPages });
        } else {
            this.setState({ currPage: 0, totalPages: 0 });
            $(thisEl).html("");
        }
    },

    render: function () {
        return (<div ref={this.props.ref}>
            <p ref={this.props.ref + "-info"} className="pagination-info">Page {this.state.currPage} of {this.state.totalPages}</p>
            <div ref={this.props.ref + "-buttons"} className="pagination-sm text-center"></div>
        </div>);
    }
});

var SmasherList = React.createClass({
    // this.props.choices is a uid to listen to, can be undefined
    mixins: [ReactFireMixin],
    // TODO: Prop for choose/remove/none button
    getInitialState: function () {
        return { pagination: this.props.pagination };
    },

    componentWillMount: function () {
        if (this.props.choices) {
            // TODO: Bind list of Smasher IDs to Firebase and include other props
        }
    },
    
    updatePagination: function () {
        // TODO: Connect to other methods
        // Update function handles totalPages == 0 case and defines custom onPageChange function
        this.refs.pagination.update({
            totalPages: this.props.pagination.totalPages,
            visiblePages: 5,
            first: "&lt;&lt;",
            prev: "&lt;",
            next: "&gt;",
            last: "&gt;&gt;"
        });
        console.log(this.props.pagination);
    },
    
    componentDidMount: function () {
        this.updatePagination();
    },
    
    componentDidUpdate: function () {
        this.updatePagination();
    },
    
    propTypes: {smashers: React.PropTypes.array},
    
    getInitialState: function () {
        return {smashers: this.props.smashers};
    },
    
    clearList: function () {
        this.setState({smashers: []});
    },
    
    render: function () {
        var createSmasher = function (smasher) {
            return (<SmasherDetail key={smasher.id} smasher={smasher} />);
        };
        return (
        <div id="search-results">
            <ol>
                {this.props.smashers.map(createSmasher)}
            </ol>
            <Pagination ref="pagination" pagination={this.props.pagination} />
        </div>);
    }
});

var SearchArea = React.createClass({
    componentDidMount: function () {
        $("#game-toggle input").change(this.clearSearchResults);
    },

    getInitialState: function () {
        return {
            text: "",
            sortType: 0,
            sortOrder: 1,
            searchResults: [],
            pagination: {}
        };
    },
    
    onChangeText: function (e) {
        this.setState({ text: e.target.value });        
    },
    
    onChangeSortType: function (e) {
        this.setState({ sortType: e.target.value });
    },
    
    onChangeSortOrder: function (e) {
        this.setState({ sortOrder: e.target.value });
    },
    
    clearSearchResults: function (e) {
        this.setState({ searchResults: [] });
    },
    
    handleSubmit: function (e) {
        e.preventDefault();
        // Retrieve game value
        var game = $("#game-toggle input:checked").val();
        var searchQuery = this.state.text;
        var sortType = this.state.sortType;
        var sortOrder = this.state.sortOrder;
        var url = "/api/play/" + game + "/search?searchQuery=" + escape(this.state.text) + "&sortType=" + sortType + "&sortOrder=" + sortOrder;
        console.log(url);
        // TODO: Call Search API instead of fake data
        $.ajax({
            url: url,
            type: "GET",
            success: this.updateSearchResults,
            error: function (data) {
                alert("Couldn't load search results!");
            }
        });
    },

    updateSearchResults: function (data) {
        this.setState({ searchResults: data.data, pagination: data.pagination });
    },
    
    render: function () {
        return (
        <div className="container-fluid">
            <form id="search-form" onSubmit={this.handleSubmit}>
                <div className="row">
                    <div className="col-md-12">
                        <input type="text" name="searchQuery" placeholder="Search" onChange={this.onChangeText} value={this.state.text} />
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-7">
                        <select name="sortType" onChange={this.onChangeSortType} value={this.state.sortType}>
                            <option value="0">Sort by Handle</option>
                            <option value="1">Sort by Popularity</option>
                        </select>
                    </div>
                    <div className="col-md-5">
                        <select name="sortOrder" onChange={this.onChangeSortOrder} value={this.state.sortOrder}>
                            <option value="1">Ascending</option>
                            <option value="-1">Descending</option>
                        </select>
                    </div>
                </div>
            </form>
            <SmasherList smashers={this.state.searchResults} pagination={this.state.pagination} />
        </div>);
    }
});

var ActionTabs = React.createClass({
    handleBefore: function (e) {
        $(APP).trigger("actionTabChange", e);
    },
    
    render: function () {
        return (
        <div className="col-xs-5 mid-col">
            <Tabs onBeforeChange={this.handleBefore}>
                <Tabs.Panel title="Play">
                    <SearchArea />
                </Tabs.Panel>
                <Tabs.Panel title="Overview">
                    <h2>How well you did</h2>
                </Tabs.Panel>
            </Tabs>
        </div>);
    }
});

$(document).ready(function () {
    // First check if logged in, then...
    React.render(<GameToggle />, $("#game-toggle").get(0));
    React.render(<RightCol />, $(".right-col").get(0));
    React.render(<ActionTabs />, $("#mid-container").get(0));
    
    /*
    $(APP).on("resultTabChange", function (e, tab) {
        console.log("Received resultTabChange:", tab);
    });
    $(APP).on("actionTabChange", function (e, tab) {
        console.log("Received actionTabChange:", tab);
    });*/
});
