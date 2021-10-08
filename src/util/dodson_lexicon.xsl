<?xml version="1.0" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

    <xsl:output method="text"/>

    <xsl:template match="/">
        <xsl:for-each select="/*/*">
            <xsl:value-of select="normalize-space(substring-before(@n, '|'))"/>
            <xsl:text>&#x09;</xsl:text>
            <xsl:value-of select="normalize-space(substring-after(@n, '|'))"/>
            <xsl:text>&#x09;</xsl:text>
            <xsl:value-of select="normalize-space(*[2])"/>
            <xsl:text>&#x09;</xsl:text>
            <xsl:value-of select="normalize-space(*[3])"/>
            <xsl:text>&#x0A;</xsl:text>
        </xsl:for-each>
     </xsl:template>

</xsl:stylesheet>
