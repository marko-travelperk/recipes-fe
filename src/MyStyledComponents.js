import styled from "styled-components";
import React from "react";

const Header = ({className, children}) => (
    <tr className={className}>{children}</tr>
);
const Row = ({className, children}) => (
    <tr className={className}>{children}</tr>
);

const Div = ({className, children}) => (
    <div className={className}>{children}</div>
);

const Table = ({className, children, ...props}) => (
    <table className={className}  {...props}>{children}</table>
);

const THeader = styled(Header)`
    background-color : #ccebff
`;

const StyledTable = styled(Table)`
    width: 100%
`;

const StyledRow = styled(Row)`
color:  #005c99;
:hover{
    background-color:#ccebff
}
`;

const Button = styled.button`
    background:#4db8ff;
    border-radius:2px;
    color: #004d80;
    font-size: 20px;
`;

const CenterDiv = styled(Div)`
    text-align:center;
    background:#e6f5ff;
    color: #006bb3
`;

export {CenterDiv, Button, StyledRow, StyledTable, THeader}