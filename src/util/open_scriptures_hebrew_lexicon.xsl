<?xml version="1.0" ?>
<xsl:stylesheet
        version="1.0"
        xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
        xmlns:os="http://openscriptures.github.com/morphhb/namespace">

    <xsl:output method="text"/>

    <xsl:template match="/os:lexicon">
        <xsl:for-each select="os:entry">
            <xsl:value-of select="os:w/text()"/>
            <xsl:text>&#x09;</xsl:text>
            <xsl:value-of select="@id"/>
            <xsl:text>&#x09;</xsl:text>
            <xsl:value-of select="os:w/@pos"/>
            <xsl:text>&#x09;</xsl:text>
            <xsl:value-of select="os:meaning"/>
            <xsl:text>&#x09;</xsl:text>
            <xsl:for-each select="os:meaning/os:def">
                <xsl:value-of select="concat(./text(), '; ')"/>
            </xsl:for-each>
            <xsl:text>&#x09;</xsl:text>
            <xsl:value-of select="os:usage/text()"/>
            <xsl:text>&#x0A;</xsl:text>
        </xsl:for-each>
     </xsl:template>

</xsl:stylesheet>
